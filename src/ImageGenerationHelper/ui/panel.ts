import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createScriptIdDiv, ensureExtensionsMenuButton, teleportStyle } from '@util/script';
import { SCRIPT_DISPLAY_NAME } from '../core/constants';
import { showErrorToast } from '../core/toast';
import SettingsPanel from './SettingsPanel';
import './panel.css';

const BUTTON_CONTAINER_ID = 'imggen_settings_container';
const BUTTON_ID = 'imggen_settings_button';
const POPUP_CONTENT_ID = 'imggen_settings_popup';

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

  const $host = createScriptIdDiv()
    .attr('id', POPUP_CONTENT_ID)
    .addClass('imggen-settings-host imggen-settings-popup-host')
    .attr('data-imggen-host', 'settings-popup');
  const root = createRoot($host[0]);
  root.render(createElement(SettingsPanel));

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) {
      return;
    }

    cleaned = true;
    observer.disconnect();
    root.unmount();
    $host.remove();
    if (activePopup?.$host[0] === $host[0]) {
      activePopup = undefined;
    }
  };

  const observer = new MutationObserver(() => {
    if (!document.body.contains($host[0])) {
      cleanup();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

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

  const tryInsert = (attempt = 0): void => {
    if (
      ensureExtensionsMenuButton({
        parent$: $,
        containerId: BUTTON_CONTAINER_ID,
        buttonId: BUTTON_ID,
        title: SCRIPT_DISPLAY_NAME,
        label: SCRIPT_DISPLAY_NAME,
        iconClass: 'fa-fw fa-solid fa-images',
        clickNamespace: '.imggensettings',
        onClick: openImageGenerationSettingsPopup,
      })
    ) {
      return;
    }

    if (attempt < 5) {
      setTimeout(() => tryInsert(attempt + 1), 900);
    }
  };

  tryInsert();

  if (typeof eventMakeLast === 'function' && typeof tavern_events !== 'undefined') {
    eventMakeLast(tavern_events.EXTENSIONS_FIRST_LOAD, () => tryInsert(0));
    eventMakeLast(tavern_events.SETTINGS_UPDATED, () => tryInsert(0));
  }

  return {
    open: openImageGenerationSettingsPopup,
    destroy: () => {
      cleanupActivePopup();
      $(`#${BUTTON_CONTAINER_ID}`).remove();
      destroy();
    },
  };
}
