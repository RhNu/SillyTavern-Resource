import type { SyncIndicatorView, TrackerSnapshot } from './types';

const HOST_SELECTOR = '#user-settings-button .drawer-toggle';
const ICON_SELECTOR = '#user-settings-button .drawer-icon';
const HOST_ACTIVE_CLASS = 'sync-indicator-host';
const RETRY_LIMIT = 8;
const RETRY_DELAY_MS = 500;

type ParentWindow = Window & typeof globalThis & { jQuery?: JQueryStatic };

function getParentJQuery(): JQueryStatic {
  return ((window.parent as ParentWindow).jQuery ?? $) as JQueryStatic;
}

function getTitle(snapshot: TrackerSnapshot): string {
  if (snapshot.state === 'syncing') {
    return snapshot.pendingCount > 0 ? `同步中 (${snapshot.pendingCount})` : '同步中';
  }

  return '已同步';
}

export function createSyncIndicatorView(): SyncIndicatorView {
  const parent$ = getParentJQuery();
  let latestSnapshot: TrackerSnapshot = { pendingCount: 0, state: 'idle' };
  let $host: JQuery<HTMLElement> | null = null;
  let $icon: JQuery<HTMLElement> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let retryCount = 0;
  let destroyed = false;
  let originalTitle: string | null = null;
  let originalAriaLabel: string | null = null;

  const isHostConnected = (): boolean => {
    return Boolean($host?.[0]?.isConnected);
  };

  const isIconConnected = (): boolean => {
    return Boolean($icon?.[0]?.isConnected);
  };

  const applySnapshot = (): void => {
    if (!$host?.length || !$icon?.length) {
      return;
    }

    const title = getTitle(latestSnapshot);
    $host
      .attr('data-state', latestSnapshot.state)
      .toggleClass('is-syncing', latestSnapshot.state === 'syncing')
      .toggleClass('is-idle', latestSnapshot.state === 'idle');

    $icon
      .attr('script_id', getScriptId())
      .attr('title', title)
      .attr('aria-label', title)
      .attr('data-sync-state', latestSnapshot.state);
  };

  const clearRetryTimer = (): void => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }
  };

  const cleanupDisconnectedNode = (): void => {
    if (!isHostConnected()) {
      $host = null;
    }

    if (isIconConnected()) {
      return;
    }

    $icon = null;
  };

  const ensureMounted = (): boolean => {
    cleanupDisconnectedNode();
    if ($icon?.length) {
      applySnapshot();
      return true;
    }

    const $nextHost = parent$(HOST_SELECTOR).first();
    const $candidate = parent$(ICON_SELECTOR).first();
    if (!$nextHost.length || !$candidate.length) {
      return false;
    }

    $host = $nextHost;
    $host.addClass(HOST_ACTIVE_CLASS);
    originalTitle = $candidate.attr('title') ?? null;
    originalAriaLabel = $candidate.attr('aria-label') ?? null;

    $icon = $candidate;
    applySnapshot();
    return true;
  };

  const scheduleMount = (): void => {
    if (destroyed) {
      return;
    }

    clearRetryTimer();
    if (ensureMounted()) {
      retryCount = 0;
      return;
    }

    if (retryCount >= RETRY_LIMIT) {
      console.warn('[SyncIndicator] User settings button was not found after retries.');
      return;
    }

    retryCount += 1;
    retryTimer = window.setTimeout(() => {
      scheduleMount();
    }, RETRY_DELAY_MS);
  };

  scheduleMount();

  return {
    render: snapshot => {
      latestSnapshot = snapshot;
      if (!ensureMounted()) {
        scheduleMount();
      }
    },
    requestRemount: () => {
      cleanupDisconnectedNode();
      retryCount = 0;
      scheduleMount();
    },
    destroy: () => {
      destroyed = true;
      clearRetryTimer();

      const $targetHost = $host?.length ? $host : parent$(HOST_SELECTOR).first();
      $targetHost.removeClass(`${HOST_ACTIVE_CLASS} is-syncing is-idle`).removeAttr('data-state');

      const $target = $icon?.length ? $icon : parent$(ICON_SELECTOR).first();
      if ($target.length) {
        $target.removeAttr('script_id').removeAttr('data-sync-state');

        if (originalTitle === null) {
          $target.removeAttr('title');
        } else {
          $target.attr('title', originalTitle);
        }

        if (originalAriaLabel === null) {
          $target.removeAttr('aria-label');
        } else {
          $target.attr('aria-label', originalAriaLabel);
        }
      }

      $host = null;
      $icon = null;
      originalTitle = null;
      originalAriaLabel = null;
    },
  };
}
