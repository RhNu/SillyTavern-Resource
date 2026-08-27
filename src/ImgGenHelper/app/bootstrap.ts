import { probeNekoaiPlugin } from '@/ImgGenHelper/adapters/ai/plugin-backend-probe';
import { BUTTON_MANUAL_PROMPT_GENERATION, SCRIPT_DISPLAY_NAME } from '@/ImgGenHelper/app/ids';
import { clearActiveDestroy, replaceActiveDestroy } from '@/ImgGenHelper/app/lifecycle';
import { initializeImageGenerationNotifier } from '@/ImgGenHelper/app/notifier';
import { createServiceRegistry } from '@/ImgGenHelper/app/service-registry';
import { initializeFloatingMenu } from '@/ImgGenHelper/features/floating-menu/controller';
import { ensureImgGenRegex, initializeImageGenerationUi } from '@/ImgGenHelper/features/image-generation/controller';
import { initializePromptGeneration } from '@/ImgGenHelper/features/prompt-generation/controller';
import { initializeSettingsPanelLauncher } from '@/ImgGenHelper/features/settings-panel/launcher';
import { attachTaskToastProjection } from '@/ImgGenHelper/features/tasking/task-projection';
import { logError } from '@/ImgGenHelper/shared/log';
import { mountToastStyles, showInfoToast, showSuccessToast, showWarningToast } from '@/ImgGenHelper/shared/toast';

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

    // 探测 NekoAI Bridge 后端插件, 供设置面板“生成后端”选项展示可用状态
    void probeNekoaiPlugin();

    const notifier = initializeImageGenerationNotifier();
    cleanups.push(notifier.destroy);

    const messageUi = initializeImageGenerationUi(registry.taskProjection, {
      onAutomaticQueueFinished: summary => {
        notifier.notifyAutomaticQueueFinished(summary);
      },
    });
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
