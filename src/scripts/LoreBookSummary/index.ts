import { openPanel } from './actions';
import { ensureExtensionsMenuButtonWithRetry } from '@util/script';
import { BUTTON_CONTAINER_ID, BUTTON_ID } from './constants';

const init = (): void => {
  console.info('[WorldbookTokenStats] Initializing.');

  const menuButton = ensureExtensionsMenuButtonWithRetry({
    containerId: BUTTON_CONTAINER_ID,
    buttonId: BUTTON_ID,
    title: '世界书统计',
    label: '世界书统计',
    iconClass: 'fa-fw fa-solid fa-book-open-reader',
    onClick: openPanel,
    onReady: () => {
      console.info('[WorldbookTokenStats] Extensions menu button ready.');
    },
    onGiveUp: () => {
      console.warn('[WorldbookTokenStats] Extensions menu button not found after retries.');
    },
  });

  $(window).on('pagehide', () => {
    console.info('[WorldbookTokenStats] Cleanup.');
    menuButton.destroy();
  });
};

$(() => {
  errorCatched(init)();
});
