import { NOTIFIER_BUS_GLOBAL_KEY } from '@/Notifier/constants';
import type { NotifierBus, NotifierSourceHandle } from '@/Notifier/bus';
import { logError, logInfo } from '@/ImageGenerationHelperV2/shared/log';
import type { AutomaticQueueCompletionSummary } from '@/ImageGenerationHelperV2/features/image-generation/controller';

const IMAGE_GENERATION_NOTIFIER_SOURCE = 'image-generation-helper-v2:auto-image';

export function initializeImageGenerationNotifier() {
  let destroyed = false;
  let sourceHandle: NotifierSourceHandle | undefined;

  void waitGlobalInitialized<NotifierBus>(NOTIFIER_BUS_GLOBAL_KEY)
    .then(bus => {
      if (destroyed || sourceHandle) {
        return;
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
