import { getHostWindow } from '@util/host';
import { teleportStyle } from '@util/tavern-helper/dom/styles';
import './index.scss';
import { attachSyncTracker } from './tracker';
import { createSyncIndicatorView } from './view';

let activeDestroy: (() => void) | null = null;

function init(): void {
  activeDestroy?.();
  console.info('[SyncIndicator] Initializing.');

  const promptWindow = getHostWindow();
  let unloadGuardAttached = false;
  const { destroy: destroyTeleportedStyle } = teleportStyle();
  const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    event.preventDefault();
  };
  const syncUnloadGuard = (active: boolean): void => {
    if (active === unloadGuardAttached) {
      return;
    }

    unloadGuardAttached = active;
    if (active) {
      console.info('[SyncIndicator] Enabling unload guard while sync is active.');
      promptWindow.addEventListener('beforeunload', handleBeforeUnload);
      return;
    }

    console.info('[SyncIndicator] Disabling unload guard after sync completed.');
    promptWindow.removeEventListener('beforeunload', handleBeforeUnload);
  };
  const view = createSyncIndicatorView();
  const tracker = attachSyncTracker(snapshot => {
    syncUnloadGuard(snapshot.pendingCount > 0);
    view.render(snapshot);
  });
  const settingsUpdatedListener = eventOn(tavern_events.SETTINGS_UPDATED, () => {
    view.requestRemount();
  });

  const destroy = () => {
    $(window).off('pagehide.sync-indicator');
    syncUnloadGuard(false);
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
