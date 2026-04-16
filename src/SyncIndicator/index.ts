import { teleportStyle } from '@util/script';
import './index.scss';
import { attachSyncTracker } from './tracker';
import { createSyncIndicatorView } from './view';

let activeDestroy: (() => void) | null = null;

function init(): void {
  activeDestroy?.();
  console.info('[SyncIndicator] Initializing.');

  const { destroy: destroyTeleportedStyle } = teleportStyle();
  const view = createSyncIndicatorView();
  const tracker = attachSyncTracker(snapshot => {
    view.render(snapshot);
  });
  const settingsUpdatedListener = eventOn(tavern_events.SETTINGS_UPDATED, () => {
    view.requestRemount();
  });

  const destroy = () => {
    $(window).off('pagehide.sync-indicator');
    settingsUpdatedListener.stop();
    tracker.destroy();
    view.destroy();
    destroyTeleportedStyle();

    if (activeDestroy === destroy) {
      activeDestroy = null;
    }
  };

  activeDestroy = destroy;

  $(window)
    .off('pagehide.sync-indicator')
    .on('pagehide.sync-indicator', () => {
      console.info('[SyncIndicator] Cleanup.');
      destroy();
    });
}

$(() => {
  errorCatched(init)();
});
