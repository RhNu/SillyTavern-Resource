import { openPanel } from './actions';
import { ensureExtensionsMenuButton } from '@util/script';
import { BUTTON_CONTAINER_ID, BUTTON_ID } from './constants';

const init = (): void => {
  console.info('[WorldbookTokenStats] Initializing.');

  const tryInsert = (attempt = 0): void => {
    if (
      ensureExtensionsMenuButton({
        containerId: BUTTON_CONTAINER_ID,
        buttonId: BUTTON_ID,
        title: '世界书统计',
        label: '世界书统计',
        iconClass: 'fa-fw fa-solid fa-book-open-reader',
        onClick: openPanel,
      })
    ) {
      console.info('[WorldbookTokenStats] Extensions menu button ready.');
      return;
    }
    if (attempt < 5) {
      setTimeout(() => tryInsert(attempt + 1), 900);
    } else {
      console.warn('[WorldbookTokenStats] Extensions menu button not found after retries.');
    }
  };

  tryInsert();

  eventMakeLast(tavern_events.EXTENSIONS_FIRST_LOAD, () => tryInsert(0));
  eventMakeLast(tavern_events.SETTINGS_UPDATED, () => tryInsert(0));

  $(window).on('pagehide', () => {
    console.info('[WorldbookTokenStats] Cleanup.');
    $(`#${BUTTON_CONTAINER_ID}`).remove();
  });
};

$(() => {
  errorCatched(init)();
});
