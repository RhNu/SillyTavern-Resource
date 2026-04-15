import { BUTTON_MANUAL_PROMPT_GENERATION, SCRIPT_DISPLAY_NAME } from './core/constants';
import { logError } from './core/log';
import { getImageGenerationStore } from './core/store';
import { createTaskCenter } from './core/task-center';
import { createTaskToastCenter } from './core/task-toast-center';
import { mountToastStyles, showInfoToast, showSuccessToast, showWarningToast } from './core/toast';
import { ensureImgGenRegex, initializeImageGenerationUi } from './image-generation/runtime';
import { initializePromptGeneration } from './prompt-generation/runtime';
import { initializeFloatingMenu } from './ui/floating-menu';
import { initializeSettingsPanelLauncher } from './ui/panel';

let activeDestroy: ((options?: { notify?: boolean }) => void) | undefined;

function initialize() {
  activeDestroy?.();

  const cleanups: Array<() => void> = [];
  const store = getImageGenerationStore();
  let destroyed = false;

  const destroyAll = (options?: { notify?: boolean }) => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    $(window).off('pagehide.imggen');

    [...cleanups].reverse().forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logError('执行销毁逻辑失败', error);
      }
    });

    if (activeDestroy === destroyAll) {
      activeDestroy = undefined;
    }

    if (options?.notify) {
      showInfoToast('脚本已卸载', SCRIPT_DISPLAY_NAME);
    }
  };

  activeDestroy = destroyAll;

  try {
    const destroyToastStyles = mountToastStyles();
    cleanups.push(destroyToastStyles);

    const settingsPanel = initializeSettingsPanelLauncher();
    cleanups.push(settingsPanel.destroy);

    const taskCenter = createTaskCenter();
    const taskToastCenter = createTaskToastCenter(taskCenter);
    cleanups.push(taskToastCenter.destroy);
    cleanups.push(taskCenter.dispose);

    const messageUi = initializeImageGenerationUi(taskCenter);
    cleanups.push(messageUi.destroy);

    const promptGeneration = initializePromptGeneration(messageUi.process, taskCenter);
    cleanups.push(promptGeneration.destroy);

    try {
      void updateScriptButtonsWith(buttons =>
        buttons.filter(button => button.name !== BUTTON_MANUAL_PROMPT_GENERATION),
      );
    } catch (error) {
      logError('移除旧版手动生成按钮失败', error);
    }

    const floatingMenu = initializeFloatingMenu({
      taskCenter,
      onOpenSettings: settingsPanel.open,
      onManualPromptGeneration: async () => {
        if (!store.config.enabled) {
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
      .off('pagehide.imggen')
      .on('pagehide.imggen', () => {
        destroyAll({ notify: true });
      });

    showSuccessToast('脚本已挂载', SCRIPT_DISPLAY_NAME);
  } catch (error) {
    destroyAll();
    throw error;
  }
}

$(() => {
  errorCatched(initialize)();
});
