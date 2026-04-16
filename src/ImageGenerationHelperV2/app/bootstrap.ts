import { BUTTON_MANUAL_PROMPT_GENERATION, SCRIPT_DISPLAY_NAME } from '@/ImageGenerationHelperV2/app/ids';
import { clearActiveDestroy, replaceActiveDestroy } from '@/ImageGenerationHelperV2/app/lifecycle';
import { createServiceRegistry } from '@/ImageGenerationHelperV2/app/service-registry';
import { logError } from '@/ImageGenerationHelperV2/shared/log';
import { mountToastStyles, showInfoToast, showSuccessToast, showWarningToast } from '@/ImageGenerationHelperV2/shared/toast';
import { attachTaskToastProjection } from '@/ImageGenerationHelperV2/features/tasking/task-projection';
import { initializeImageGenerationUi, ensureImgGenRegex } from '@/ImageGenerationHelperV2/features/image-generation/controller';
import { initializePromptGeneration } from '@/ImageGenerationHelperV2/features/prompt-generation/controller';
import { initializeFloatingMenu } from '@/ImageGenerationHelperV2/features/floating-menu/controller';
import { initializeSettingsPanelLauncher } from '@/ImageGenerationHelperV2/features/settings-panel/launcher';

export function bootstrapImageGenerationHelperV2() {
  const cleanups: Array<() => void> = [];
  const registry = createServiceRegistry();
  let destroyed = false;

  const destroyAll = (options?: { notify?: boolean }) => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    $(window).off('pagehide.imggen-v2');

    [...cleanups].reverse().forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logError('执行销毁逻辑失败', error);
      }
    });

    clearActiveDestroy(destroyAll);

    if (options?.notify) {
      showInfoToast('脚本已卸载', SCRIPT_DISPLAY_NAME);
    }
  };

  replaceActiveDestroy(destroyAll);

  try {
    const destroyToastStyles = mountToastStyles();
    cleanups.push(destroyToastStyles);

    const taskToasts = attachTaskToastProjection(registry.taskProjection);
    cleanups.push(taskToasts.destroy);
    cleanups.push(registry.taskProjection.dispose);

    const settingsPanel = initializeSettingsPanelLauncher();
    cleanups.push(settingsPanel.destroy);

    const messageUi = initializeImageGenerationUi(registry.taskProjection);
    cleanups.push(messageUi.destroy);

    const promptGeneration = initializePromptGeneration(messageUi.process, registry.taskProjection);
    cleanups.push(promptGeneration.destroy);

    try {
      void updateScriptButtonsWith(buttons =>
        buttons.filter(button => button.name !== BUTTON_MANUAL_PROMPT_GENERATION),
      );
    } catch (error) {
      logError('移除旧版手动生成按钮失败', error);
    }

    const floatingMenu = initializeFloatingMenu({
      taskCenter: registry.taskProjection,
      onOpenSettings: settingsPanel.open,
      onManualPromptGeneration: async () => {
        if (!registry.configStore.config.enabled) {
          showWarningToast('脚本已关闭');
          return;
        }
        await promptGeneration.rerunLatest();
      },
    });
    cleanups.push(floatingMenu.destroy);

    void ensureImgGenRegex().catch(error => {
      logError('同步图片锚点过滤正则失败', error);
    });

    $(window)
      .off('pagehide.imggen-v2')
      .on('pagehide.imggen-v2', () => {
        destroyAll({ notify: true });
      });

    showSuccessToast('脚本已挂载', SCRIPT_DISPLAY_NAME);
    return {
      destroy: destroyAll,
    };
  } catch (error) {
    destroyAll();
    throw error;
  }
}
