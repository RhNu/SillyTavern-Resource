import type { AutomaticQueueCompletionSummary } from '@/ImgGenHelper/features/image-generation/controller';
import { logError, logInfo } from '@/ImgGenHelper/shared/log';
import type { NotifierBus, NotifierSourceHandle } from '@/Notifier/bus';
import { NOTIFIER_BUS_GLOBAL_KEY } from '@/Notifier/constants';

const IMAGE_GENERATION_NOTIFIER_SOURCE = 'image-generation-helper-v2:auto-image';

function getNotifierBus(): NotifierBus | undefined {
  const bus = (globalThis as Record<string, unknown>)[NOTIFIER_BUS_GLOBAL_KEY];
  if (!bus || typeof bus !== 'object' || typeof (bus as NotifierBus).registerSource !== 'function') {
    return undefined;
  }

  return bus as NotifierBus;
}

export function initializeImageGenerationNotifier() {
  let destroyed = false;
  let sourceHandle: NotifierSourceHandle | undefined;

  void waitGlobalInitialized(NOTIFIER_BUS_GLOBAL_KEY)
    .then(() => {
      if (destroyed || sourceHandle) {
        return;
      }

      const bus = getNotifierBus();
      if (!bus) {
        throw new Error(`全局接口 ${NOTIFIER_BUS_GLOBAL_KEY} 不可用`);
      }

      sourceHandle = bus.registerSource(IMAGE_GENERATION_NOTIFIER_SOURCE, {
        title: '自动生图完成',
      });
      logInfo('已接入 Notifier 通知总线');
    })
    .catch(error => {
      logError('接入 Notifier 通知总线失败', error);
    });

  return {
    notifyAutomaticQueueFinished(summary: AutomaticQueueCompletionSummary) {
      sourceHandle?.notify({
        body: summary.message,
      });
    },
    destroy() {
      destroyed = true;
      sourceHandle?.unregister();
      sourceHandle = undefined;
    },
  };
}
