import type { NotifierBus, NotifierSourceHandle } from '@/notifier/bus';
import { NOTIFIER_BUS_GLOBAL_KEY } from '@/notifier/constants';
import type { GenerationQueueCompletionSummary } from '../image-generation/queue';

const NOTIFIER_SOURCE = 'novelai-image-helper:image-generation';
const NOTIFIER_TITLE = 'NovelAI 图片生成';

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

  void waitGlobalInitialized(NOTIFIER_BUS_GLOBAL_KEY)
    .then(() => {
      if (destroyed || sourceHandle) return;

      const bus = getNotifierBus();
      if (!bus) throw new Error(`全局接口 ${NOTIFIER_BUS_GLOBAL_KEY} 不可用`);

      sourceHandle = bus.registerSource(NOTIFIER_SOURCE, { title: NOTIFIER_TITLE });
      console.info('[NovelAI Image Helper] 已接入 Notifier 通知总线');

      pendingSummaries.splice(0).forEach(summary => notifySummary(summary));
    })
    .catch(error => {
      console.warn('[NovelAI Image Helper] 接入 Notifier 通知总线失败', error);
    });

  const notifySummary = (summary: GenerationQueueCompletionSummary): void => {
    if (destroyed || !shouldNotify(summary)) return;
    sourceHandle?.notify({ body: buildGenerationNotificationBody(summary) });
  };

  return {
    notifyQueueFinished(summary: GenerationQueueCompletionSummary): void {
      if (destroyed || !shouldNotify(summary)) return;
      if (sourceHandle) notifySummary(summary);
      else pendingSummaries.push({ ...summary, failureMessages: [...summary.failureMessages] });
    },
    destroy(): void {
      destroyed = true;
      pendingSummaries.splice(0);
      sourceHandle?.unregister();
      sourceHandle = undefined;
    },
  };
}
