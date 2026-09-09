import { createLogger } from '@util/common';
import { getHostDocument } from '@util/host';
import { ensureExtensionsMenuButtonWithRetry, teleportStyle } from '@util/script';
import { createTemporaryHost } from '@util/ui';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SCRIPT_DISPLAY_NAME, STYLE_TUNER_IDS } from './constants';
import SettingsPanel from './SettingsPanel';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

type ActivePopup = {
  root: Root;
  cleanup: () => void;
  $host: JQuery<HTMLDivElement>;
};

let activePopup: ActivePopup | undefined;

function cleanupActivePopup(): void {
  activePopup?.cleanup();
}

/** 打开样式调整设置弹窗 */
export function openStyleTunerPopup(): void {
  const hostDoc = getHostDocument();

  if (activePopup && hostDoc.body.contains(activePopup.$host[0])) {
    return;
  }

  cleanupActivePopup();

  if (typeof SillyTavern?.callGenericPopup !== 'function' || typeof SillyTavern?.POPUP_TYPE === 'undefined') {
    logger.error('弹窗接口不可用，请检查酒馆版本。');
    return;
  }

  let cleaned = false;
  let cleanup = () => undefined;
  const hostHandle = createTemporaryHost({
    doc: hostDoc,
    id: STYLE_TUNER_IDS.popupContent,
    className: 'styletuner-host styletuner-popup-host',
    attributes: {
      'data-styletuner-host': 'settings-popup',
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
      // 窄弹窗：仅保留纵向滚动，不使用 wide/large 放大
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

/** 在魔法棒扩展菜单添加按钮并初始化设置弹窗 */
export function initializeStyleTunerLauncher() {
  const { destroy: destroyTeleportedStyle } = teleportStyle();
  const menuButton = ensureExtensionsMenuButtonWithRetry({
    parent$: $,
    containerId: STYLE_TUNER_IDS.buttonContainer,
    buttonId: STYLE_TUNER_IDS.button,
    title: SCRIPT_DISPLAY_NAME,
    label: SCRIPT_DISPLAY_NAME,
    iconClass: 'fa-fw fa-solid fa-palette',
    clickNamespace: '.styletuner',
    onClick: openStyleTunerPopup,
  });

  return {
    open: openStyleTunerPopup,
    destroy: () => {
      cleanupActivePopup();
      menuButton.destroy();
      destroyTeleportedStyle();
    },
  };
}
