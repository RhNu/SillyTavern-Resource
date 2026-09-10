import { teleportStyle } from '@util/script';
import { matchAnchors } from '../domain/anchor';
import { mountMessageCards } from '../ui/message-cards';
import { mountProgressToast } from '../ui/progress-toast';
import { mountWorkIndicator } from '../ui/work-indicator';
import { openSettings } from '../ui/settings';
import '../ui/styles.css';
import { initializeNovelAiImageNotifier } from './notifier';
import { isAnalysisCancelledError, NovelAiImageService } from './service';
import { createLogger, serializeError } from './logger';
import { destroyPreviousInstance, registerActiveInstance, unregisterActiveInstance } from './lifecycle';

const SCRIPT_NAME = 'NovelAI 图片助手';
const ANALYZE_BUTTON = '& 提示生成';
const SETTINGS_BUTTON = '& 生成设置';
const PROMPT_REGEX_NAME = '[NOVELAI_IMAGE_HELPER] 隐藏图片锚点';
const PROMPT_REGEX = String.raw`/\[\[NovelAIImage\s+id=(?:"[^"\]]+"|'[^'\]]+')\s*\]\]/gsi`;
const logger = createLogger('app/bootstrap');

/**
 * This is only the persisted-anchor display/prompt filter. User-configured context cleanup
 * rules are compiled and applied inside prompt-analysis/context-cleaner.ts instead.
 */
function ensurePromptFilter(): void {
  try {
    const regexes = getTavernRegexes({ type: 'global' });
    const existing = regexes.find(regex => regex.script_name === PROMPT_REGEX_NAME);
    if (
      existing?.find_regex === PROMPT_REGEX &&
      existing.enabled &&
      existing.destination.prompt &&
      !existing.destination.display
    ) {
      logger.debug('提示词过滤正则已存在且配置正确');
      return;
    }
    logger.info('开始写入提示词过滤正则', { existing: Boolean(existing) });
    void Promise.resolve(
      updateTavernRegexesWith(
        current => {
          const target = current.find(regex => regex.script_name === PROMPT_REGEX_NAME);
          const value: TavernRegex = {
            id: target?.id ?? crypto.randomUUID(),
            script_name: PROMPT_REGEX_NAME,
            enabled: true,
            find_regex: PROMPT_REGEX,
            replace_string: '',
            trim_strings: [],
            source: { user_input: false, ai_output: true, slash_command: false, world_info: false, reasoning: false },
            destination: { display: false, prompt: true },
            run_on_edit: true,
            min_depth: null,
            max_depth: null,
          };
          if (target) Object.assign(target, value);
          else current.push(value);
          return current;
        },
        { type: 'global' },
      ),
    )
      .then(() => logger.info('提示词过滤正则写入完成'))
      .catch(error => logger.error('写入提示词过滤正则失败', error));
  } catch (error) {
    logger.error('准备提示词过滤正则失败', error);
  }
}

export function bootstrap(): { destroy: () => void } {
  destroyPreviousInstance();
  logger.info('开始初始化图片助手');
  const notifier = initializeNovelAiImageNotifier();
  const service = new NovelAiImageService({
    onGenerationQueueFinished: notifier.notifyQueueFinished,
  });
  service.recoverInterruptedBlocks();
  const style = teleportStyle();
  const cards = mountMessageCards(service);
  const workIndicator = mountWorkIndicator(service);
  const progressToast = mountProgressToast(service);
  const stops: Array<() => void> = [];
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;

  appendInexistentScriptButtons([
    { name: ANALYZE_BUTTON, visible: true },
    { name: SETTINGS_BUTTON, visible: true },
  ]);
  stops.push(
    eventOn(getButtonEvent(ANALYZE_BUTTON), () => {
      try {
        logger.info('点击手动分析按钮');
        void service
          .analyzeLatest(true)
          .then(blocks => {
            logger.info('手动分析完成', { blockCount: blocks.length });
            if (blocks.length === 0) toastr.info('模型认为当前消息不需要插图', SCRIPT_NAME);
            else toastr.success(`已创建 ${blocks.length} 个图片块`, SCRIPT_NAME);
          })
          .catch(error => {
            if (isAnalysisCancelledError(error)) {
              logger.info('手动分析已由用户中断', { messageId: error.messageId });
              toastr.info(error.message, SCRIPT_NAME);
              return;
            }
            logger.error('手动分析失败', error);
            toastr.error(error instanceof Error ? error.message : String(error), SCRIPT_NAME);
          });
      } catch (error) {
        logger.error('启动手动分析失败', error);
        toastr.error(error instanceof Error ? error.message : String(error), SCRIPT_NAME);
      }
    }).stop,
    eventOn(getButtonEvent(SETTINGS_BUTTON), () => {
      try {
        logger.debug('打开图片助手设置');
        openSettings(service);
      } catch (error) {
        logger.error('打开图片助手设置失败', error);
        toastr.error(error instanceof Error ? error.message : String(error), SCRIPT_NAME);
      }
    }).stop,
    eventOn(tavern_events.MESSAGE_RECEIVED, (messageId: number) => {
      try {
        const settings = service.settings.get();
        if (!settings.enabled || !settings.analysis.auto || messageId < settings.analysis.minimumFloor) return;
        const message = getChatMessages(messageId)[0];
        if (!message || message.role !== 'assistant' || matchAnchors(message.message).length > 0) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        logger.debug('已安排自动分析', { messageId, debounceMs: settings.analysis.debounceMs });
        debounceTimer = setTimeout(() => {
          debounceTimer = undefined;
          logger.info('开始自动分析', { messageId });
          void service
            .analyzeMessage(messageId, service.settings.get().analysis.autoGenerate)
            .then(blocks => {
              logger.info('自动分析完成', { messageId, blockCount: blocks.length });
              if (blocks.length > 0) toastr.success(`自动创建了 ${blocks.length} 个图片块`, SCRIPT_NAME);
            })
            .catch(error => {
              if (isAnalysisCancelledError(error)) {
                logger.info('自动分析已由用户中断', { messageId });
                toastr.info(error.message, SCRIPT_NAME);
                return;
              }
              logger.error('自动分析失败', error, { messageId });
            });
        }, settings.analysis.debounceMs);
      } catch (error) {
        logger.error('处理消息接收事件失败', error, { messageId });
      }
    }).stop,
    eventOn(tavern_events.CHAT_CHANGED, () => window.location.reload()).stop,
  );

  initializeGlobal('NovelAIImageHelper', {
    analyzeMessage: (messageId: number, generate = false) => service.analyzeMessage(messageId, generate),
    generateBlock: (messageId: number, blockId: string) => service.generate(messageId, blockId),
    getBlock: (messageId: number, blockId: string) => service.repository.find(messageId, blockId),
    getQueueSnapshot: () => service.getQueueSnapshot(),
    pauseQueue: () => service.pauseQueue(),
    resumeQueue: () => service.resumeQueue(),
    cancelQueue: () => service.cancelQueue(),
    cancelAnalysis: () => service.cancelAnalysis(),
    retryFailedBlocks: () => service.retryFailedBlocks(),
  });
  ensurePromptFilter();
  logger.debug('开始检查 imggen-novelai 后端能力');
  void service.backend
    .capabilities()
    .then(capabilities => {
      logger.info('imggen-novelai 后端能力检查完成', {
        configured: capabilities.configured,
        modelCount: capabilities.models.length,
      });
      if (!capabilities.configured) toastr.warning('imggen-novelai 已加载，但服务端未配置 NOVELAI_TOKEN', SCRIPT_NAME);
    })
    .catch(error => logger.warn('imggen-novelai 不可用', { error: serializeError(error) }));

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    unregisterActiveInstance(destroy);
    logger.info('开始卸载图片助手');
    if (debounceTimer) clearTimeout(debounceTimer);
    stops.forEach(stop => stop());
    [
      ['progress toast', () => progressToast.destroy()],
      ['work indicator', () => workIndicator.destroy()],
      ['message cards', () => cards.destroy()],
      ['service', () => service.destroy()],
      ['notifier', () => notifier.destroy()],
      ['style', () => style.destroy()],
    ].forEach(([name, cleanup]) => {
      try {
        (cleanup as () => void)();
      } catch (error) {
        logger.error('卸载组件失败', error, { component: name });
      }
    });
    $(window).off('pagehide.novelaiImageHelper');
    logger.info('图片助手已卸载');
  };
  registerActiveInstance(destroy);
  $(window).off('pagehide.novelaiImageHelper').on('pagehide.novelaiImageHelper', destroy);
  logger.info('图片助手已加载');
  return { destroy };
}
