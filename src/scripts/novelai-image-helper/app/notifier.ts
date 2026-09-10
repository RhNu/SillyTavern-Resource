import type { NotifierBus, NotifierSourceHandle } from '@/notifier/bus';
import { NOTIFIER_BUS_GLOBAL_KEY } from '@/notifier/constants';
import type { GenerationQueueCompletionSummary } from '../image-generation/queue';
import { createLogger, serializeError } from './logger';

const NOTIFIER_SOURCE = 'novelai-image-helper:image-generation';
const NOTIFIER_TITLE = 'NovelAI 图片生成';
const logger = createLogger('app/notifier');

function getNotifierBus(): NotifierBus | undefined {
  const bus = (globalThis as Record<string, unknown>)[NOTIFIER_BUS_GLOBAL_KEY];
  if (!bus || typeof bus !== 'object' || typeof (bus as NotifierBus).registerSource !== 'function') {
    return undefined;
  }

  return bus as NotifierBus;
}

export function buildGenerationNotificationBody(summary: GenerationQueueCompletionSummary): string {
  const parts: string[] = [];
  if (summary.succeededCount > 0) parts.push(`${summary.succeededCount} 个完成`);
  if (summary.failedCount > 0) parts.push(`${summary.failedCount} 个失败`);
  if (summary.cancelledCount > 0) parts.push(`${summary.cancelledCount} 个已取消`);

  const details: string[] = [];
  if (summary.retriedCount > 0) details.push(`自动重试 ${summary.retriedCount} 次`);
  if (summary.failedCount === 1 && summary.failureMessages[0]) details.push(summary.failureMessages[0]);

  return parts.length > 0
    ? `生图队列结束，${parts.join('，')}${details.length > 0 ? `（${details.join('；')}）` : ''}`
    : '生图队列结束，没有可处理的图片任务';
}

function shouldNotify(summary: GenerationQueueCompletionSummary): boolean {
  return summary.succeededCount > 0 || summary.failedCount > 0;
}

export function initializeNovelAiImageNotifier() {
  let destroyed = false;
  let sourceHandle: NotifierSourceHandle | undefined;
  const pendingSummaries: GenerationQueueCompletionSummary[] = [];

  logger.debug('开始连接 Notifier 通知总线', { globalKey: NOTIFIER_BUS_GLOBAL_KEY });

  void waitGlobalInitialized(NOTIFIER_BUS_GLOBAL_KEY)
    .then(() => {
      if (destroyed || sourceHandle) return;

      const bus = getNotifierBus();
      if (!bus) throw new Error(`全局接口 ${NOTIFIER_BUS_GLOBAL_KEY} 不可用`);

      sourceHandle = bus.registerSource(NOTIFIER_SOURCE, { title: NOTIFIER_TITLE });
      logger.info('已接入 Notifier 通知总线', { pendingCount: pendingSummaries.length });

      pendingSummaries.splice(0).forEach(summary => notifySummary(summary));
    })
    .catch(error => {
      logger.warn('接入 Notifier 通知总线失败', { error: serializeError(error) });
    });

  const notifySummary = (summary: GenerationQueueCompletionSummary): void => {
    if (destroyed || !shouldNotify(summary)) return;
    if (!sourceHandle) return;
    try {
      sourceHandle.notify({ body: buildGenerationNotificationBody(summary) });
      logger.debug('已发送生图队列通知', {
        requestId: summary.requestId,
        succeededCount: summary.succeededCount,
        failedCount: summary.failedCount,
        cancelledCount: summary.cancelledCount,
      });
    } catch (error) {
      logger.error('发送生图队列通知失败', error, { requestId: summary.requestId });
    }
  };

  return {
    notifyQueueFinished(summary: GenerationQueueCompletionSummary): void {
      if (destroyed || !shouldNotify(summary)) return;
      if (sourceHandle) notifySummary(summary);
      else {
        pendingSummaries.push({ ...summary, failureMessages: [...summary.failureMessages] });
        logger.debug('Notifier 尚未就绪，暂存队列摘要', {
          requestId: summary.requestId,
          pendingCount: pendingSummaries.length,
        });
      }
    },
    destroy(): void {
      destroyed = true;
      pendingSummaries.splice(0);
      try {
        sourceHandle?.unregister();
      } catch (error) {
        logger.error('注销 Notifier 通知源失败', error);
      }
      sourceHandle = undefined;
      logger.debug('Notifier 通知源已销毁');
    },
  };
}
