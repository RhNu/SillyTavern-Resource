import { matchAnchors } from '../domain/anchor';
import { NovelAiImageService } from './service';
import { mountMessageCards } from '../ui/message-cards';
import { openSettings } from '../ui/settings';
import { teleportStyle } from '@util/script';
import '../ui/styles.css';

const SCRIPT_NAME = 'NovelAI 图片助手';
const ANALYZE_BUTTON = '分析并生成图片';
const SETTINGS_BUTTON = 'NovelAI 图片设置';
const PROMPT_REGEX_NAME = '[NOVELAI_IMAGE_HELPER] 隐藏图片锚点';
const PROMPT_REGEX = String.raw`/\[\[NovelAIImage\s+id=(?:"[^"\]]+"|'[^'\]]+')\s*\]\]/gsi`;

function ensurePromptFilter(): void {
  const regexes = getTavernRegexes({ type: 'global' });
  const existing = regexes.find(regex => regex.script_name === PROMPT_REGEX_NAME);
  if (
    existing?.find_regex === PROMPT_REGEX &&
    existing.enabled &&
    existing.destination.prompt &&
    !existing.destination.display
  ) {
    return;
  }
  void updateTavernRegexesWith(
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
  ).catch(error => console.error(`[${SCRIPT_NAME}] 写入提示词过滤正则失败`, error));
}

export function bootstrap(): { destroy: () => void } {
  const service = new NovelAiImageService();
  service.recoverInterruptedBlocks();
  const style = teleportStyle();
  const cards = mountMessageCards(service);
  const stops: Array<() => void> = [];
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;

  appendInexistentScriptButtons([
    { name: ANALYZE_BUTTON, visible: true },
    { name: SETTINGS_BUTTON, visible: true },
  ]);
  stops.push(
    eventOn(getButtonEvent(ANALYZE_BUTTON), () => {
      void service
        .analyzeLatest(true)
        .then(blocks => {
          if (blocks.length === 0) toastr.info('模型认为当前消息不需要插图', SCRIPT_NAME);
          else toastr.success(`已创建 ${blocks.length} 个图片块`, SCRIPT_NAME);
        })
        .catch(error => toastr.error(error instanceof Error ? error.message : String(error), SCRIPT_NAME));
    }).stop,
    eventOn(getButtonEvent(SETTINGS_BUTTON), () => openSettings(service)).stop,
    eventOn(tavern_events.MESSAGE_RECEIVED, (messageId: number) => {
      const settings = service.settings.get();
      if (!settings.enabled || !settings.analysis.auto || messageId < settings.analysis.minimumFloor) return;
      const message = getChatMessages(messageId)[0];
      if (!message || message.role !== 'assistant' || matchAnchors(message.message).length > 0) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        void service
          .analyzeMessage(messageId, service.settings.get().analysis.autoGenerate)
          .then(blocks => {
            if (blocks.length > 0) toastr.success(`自动创建了 ${blocks.length} 个图片块`, SCRIPT_NAME);
          })
          .catch(error => console.error(`[${SCRIPT_NAME}] 自动分析失败`, error));
      }, settings.analysis.debounceMs);
    }).stop,
    eventOn(tavern_events.CHAT_CHANGED, () => window.location.reload()).stop,
  );

  initializeGlobal('NovelAIImageHelper', {
    analyzeMessage: (messageId: number, generate = false) => service.analyzeMessage(messageId, generate),
    generateBlock: (messageId: number, blockId: string) => service.generate(messageId, blockId),
    getBlock: (messageId: number, blockId: string) => service.repository.find(messageId, blockId),
  });
  ensurePromptFilter();
  void service.backend
    .capabilities()
    .then(capabilities => {
      if (!capabilities.configured) toastr.warning('imggen-novelai 已加载，但服务端未配置 NOVELAI_TOKEN', SCRIPT_NAME);
    })
    .catch(error => console.warn(`[${SCRIPT_NAME}] imggen-novelai 不可用`, error));

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    stops.forEach(stop => stop());
    cards.destroy();
    service.destroy();
    style.destroy();
    $(window).off('pagehide.novelaiImageHelper');
  };
  $(window).off('pagehide.novelaiImageHelper').on('pagehide.novelaiImageHelper', destroy);
  console.info(`[${SCRIPT_NAME}] 已加载`);
  return { destroy };
}
