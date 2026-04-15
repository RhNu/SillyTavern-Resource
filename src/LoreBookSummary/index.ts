import { BUTTON_CONTAINER_ID } from './constants';
import { openPanel } from './actions';
import { ensureExtensionsButton } from './extensionsButton';

const init = (): void => {
  if (typeof $ !== 'function') {
    console.error('[WorldbookTokenStats] jQuery not available.');
    return;
  }
  console.info('[WorldbookTokenStats] Initializing.');

  const tryInsert = (attempt = 0): void => {
    if (ensureExtensionsButton($, openPanel)) {
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

  if (typeof eventMakeLast === 'function' && typeof tavern_events !== 'undefined') {
    eventMakeLast(tavern_events.EXTENSIONS_FIRST_LOAD, () => tryInsert(0));
    eventMakeLast(tavern_events.SETTINGS_UPDATED, () => tryInsert(0));
  }

  $(window).on('pagehide', () => {
    console.info('[WorldbookTokenStats] Cleanup.');
    $(`#${BUTTON_CONTAINER_ID}`).remove();
  });
};

$(() => {
  errorCatched(init)();
});
