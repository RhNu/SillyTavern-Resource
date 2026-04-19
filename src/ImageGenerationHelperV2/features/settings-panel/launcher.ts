import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ensureExtensionsMenuButtonWithRetry, teleportStyle } from '@util/script';
import { createTemporaryHost } from '@util/ui';
import { SCRIPT_DISPLAY_NAME, SETTINGS_PANEL_IDS } from '@/ImageGenerationHelperV2/app/ids';
import { showErrorToast } from '@/ImageGenerationHelperV2/shared/toast';
import SettingsPanel from '@/ImageGenerationHelperV2/features/settings-panel/view/SettingsPanel';
import '@/ImageGenerationHelperV2/features/settings-panel/view/panel.css';

const BUTTON_CONTAINER_ID = SETTINGS_PANEL_IDS.buttonContainer;
const BUTTON_ID = SETTINGS_PANEL_IDS.button;
const POPUP_CONTENT_ID = SETTINGS_PANEL_IDS.popupContent;

let activePopup:
  | {
      root: Root;
      cleanup: () => void;
      $host: JQuery<HTMLDivElement>;
    }
  | undefined;

function cleanupActivePopup(): void {
  activePopup?.cleanup();
}

export function openImageGenerationSettingsPopup(): void {
  if (activePopup && document.body.contains(activePopup.$host[0])) {
    return;
  }

  cleanupActivePopup();

  if (typeof SillyTavern?.callGenericPopup !== 'function' || typeof SillyTavern?.POPUP_TYPE === 'undefined') {
    showErrorToast('弹窗接口不可用，请检查酒馆版本。', SCRIPT_DISPLAY_NAME);
    return;
  }

  let cleaned = false;
  let cleanup = () => undefined;
  const hostHandle = createTemporaryHost({
    id: POPUP_CONTENT_ID,
    className: 'imggen-settings-host imggen-settings-popup-host',
    attributes: {
      'data-imggen-host': 'settings-popup',
    },
    onDisconnected: () => cleanup(),
  });
  const $host = hostHandle.$host;
  const root = createRoot($host[0]);
  root.render(createElement(SettingsPanel));

  cleanup = () => {
    if (cleaned) {
      return;
    }

    cleaned = true;
    root.unmount();
    hostHandle.destroy();
    if (activePopup?.$host[0] === $host[0]) {
      activePopup = undefined;
    }
  };

  activePopup = {
    root,
    cleanup,
    $host,
  };

  try {
    const popupRequest = SillyTavern.callGenericPopup($host, SillyTavern.POPUP_TYPE.DISPLAY, SCRIPT_DISPLAY_NAME, {
      wide: true,
      large: true,
      allowVerticalScrolling: true,
      leftAlign: true,
    });

    if (popupRequest && typeof popupRequest.finally === 'function') {
      void popupRequest.finally(cleanup);
    }
  } catch (error) {
    cleanup();
    throw error;
  }
}

export function initializeSettingsPanelLauncher() {
  const { destroy } = teleportStyle();
  const menuButton = ensureExtensionsMenuButtonWithRetry({
    parent$: $,
    containerId: BUTTON_CONTAINER_ID,
    buttonId: BUTTON_ID,
    title: SCRIPT_DISPLAY_NAME,
    label: SCRIPT_DISPLAY_NAME,
    iconClass: 'fa-fw fa-solid fa-images',
    clickNamespace: '.imggensettings',
    onClick: openImageGenerationSettingsPopup,
  });

  return {
    open: openImageGenerationSettingsPopup,
    destroy: () => {
      cleanupActivePopup();
      menuButton.destroy();
      destroy();
    },
  };
}
