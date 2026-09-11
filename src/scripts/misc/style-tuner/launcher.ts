import { createLogger } from '@util/common';
import { openReactPopup, type ReactPopupSession } from '@util/react/st-popup';
import { ensureExtensionsMenuButtonWithRetry, teleportStyle } from '@util/script';
import { createElement } from 'react';
import { SCRIPT_DISPLAY_NAME, STYLE_TUNER_IDS } from './constants';
import SettingsPanel from './SettingsPanel';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

let activePopup: ReactPopupSession | undefined;

function cleanupActivePopup(): void {
  if (!activePopup || activePopup.isClosed) return;
  void activePopup.cancel().catch(error => logger.error('关闭设置弹窗失败', error));
}

/** 打开样式调整设置弹窗 */
export function openStyleTunerPopup(): void {
  if (activePopup && !activePopup.isClosed) return;

  cleanupActivePopup();
  const session = openReactPopup({
    title: SCRIPT_DISPLAY_NAME,
    id: STYLE_TUNER_IDS.popupContent,
    className: 'styletuner-host styletuner-popup-host',
    attributes: { 'data-styletuner-host': 'settings-popup' },
    popup: {
      allowVerticalScrolling: true,
      leftAlign: true,
    },
    render: () => createElement(SettingsPanel),
  });
  activePopup = session;
  void session.closed
    .catch(error => logger.error('设置弹窗异常结束', error))
    .finally(() => {
      if (activePopup === session) activePopup = undefined;
    });
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
