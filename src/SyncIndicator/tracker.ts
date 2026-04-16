import type { TrackerHandle, TrackerListener, TrackerSnapshot, SyncVisualState } from './types';

const TRACKER_KEY = '__TH_SYNC_INDICATOR_TRACKER__';
const XHR_METHOD_KEY = '__thSyncIndicatorMethod__';
const IDLE_DELAY_MS = 500;

type MonitoredWindow = Window &
  typeof globalThis & {
    [TRACKER_KEY]?: WindowTrackerStore;
  };

type TrackedXMLHttpRequest = XMLHttpRequest & {
  [XHR_METHOD_KEY]?: string;
};

type WindowTrackerStore = {
  listeners: Set<TrackerListener>;
  originalFetch: typeof window.fetch | undefined;
  originalXhrOpen: typeof XMLHttpRequest.prototype.open;
  originalXhrSend: typeof XMLHttpRequest.prototype.send;
  pendingCount: number;
  state: SyncVisualState;
  idleTimer: ReturnType<typeof setTimeout> | undefined;
};

function getTrackingWindow(): MonitoredWindow {
  try {
    if (window.parent && window.parent !== window) {
      return window.parent as MonitoredWindow;
    }
  } catch (error) {
    console.warn('[SyncIndicator] Falling back to iframe window for tracking.', error);
  }

  return window as MonitoredWindow;
}

function createSnapshot(store: WindowTrackerStore): TrackerSnapshot {
  return {
    pendingCount: store.pendingCount,
    state: store.state,
  };
}

function emitSnapshot(store: WindowTrackerStore): void {
  const snapshot = createSnapshot(store);
  store.listeners.forEach(listener => {
    listener(snapshot);
  });
}

function normalizeMethod(method: string | null | undefined): string {
  return (method ?? 'GET').trim().toUpperCase();
}

function shouldTrackMethod(method: string | null | undefined): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizeMethod(method));
}

function getFetchMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) {
    return init.method;
  }

  if (typeof input === 'object' && input !== null && 'method' in input && typeof input.method === 'string') {
    return input.method;
  }

  return 'GET';
}

function clearIdleTimer(store: WindowTrackerStore): void {
  if (store.idleTimer) {
    clearTimeout(store.idleTimer);
    store.idleTimer = undefined;
  }
}

function beginTrackedRequest(store: WindowTrackerStore): void {
  clearIdleTimer(store);
  store.pendingCount += 1;
  store.state = 'syncing';
  emitSnapshot(store);
}

function endTrackedRequest(store: WindowTrackerStore): void {
  store.pendingCount = Math.max(0, store.pendingCount - 1);
  if (store.pendingCount > 0) {
    emitSnapshot(store);
    return;
  }

  emitSnapshot(store);
  clearIdleTimer(store);
  store.idleTimer = window.setTimeout(() => {
    if (store.pendingCount === 0) {
      store.state = 'idle';
      emitSnapshot(store);
    }
    store.idleTimer = undefined;
  }, IDLE_DELAY_MS);
}

function teardownStore(targetWindow: MonitoredWindow, store: WindowTrackerStore): void {
  clearIdleTimer(store);

  if (store.originalFetch) {
    targetWindow.fetch = store.originalFetch;
  }

  targetWindow.XMLHttpRequest.prototype.open = store.originalXhrOpen;
  targetWindow.XMLHttpRequest.prototype.send = store.originalXhrSend;

  delete targetWindow[TRACKER_KEY];
}

function ensureStore(targetWindow: MonitoredWindow): WindowTrackerStore {
  const existingStore = targetWindow[TRACKER_KEY];
  if (existingStore) {
    return existingStore;
  }

  const store: WindowTrackerStore = {
    listeners: new Set(),
    originalFetch: targetWindow.fetch,
    originalXhrOpen: targetWindow.XMLHttpRequest.prototype.open,
    originalXhrSend: targetWindow.XMLHttpRequest.prototype.send,
    pendingCount: 0,
    state: 'idle',
    idleTimer: undefined,
  };

  const originalFetch = store.originalFetch;
  if (originalFetch) {
    targetWindow.fetch = (async (...args: Parameters<typeof fetch>) => {
      const method = getFetchMethod(args[0], args[1]);
      if (!shouldTrackMethod(method)) {
        return originalFetch.apply(targetWindow, args);
      }

      beginTrackedRequest(store);
      try {
        return await originalFetch.apply(targetWindow, args);
      } finally {
        endTrackedRequest(store);
      }
    }) as typeof window.fetch;
  }

  const xhrPrototype = targetWindow.XMLHttpRequest.prototype;
  const originalOpen = store.originalXhrOpen;
  const originalSend = store.originalXhrSend;
  const originalOpenShort = originalOpen as (this: XMLHttpRequest, method: string, url: string | URL) => void;
  const originalOpenLong = originalOpen as (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async: boolean,
    username?: string | null,
    password?: string | null,
  ) => void;

  xhrPrototype.open = function (
    this: TrackedXMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    this[XHR_METHOD_KEY] = method;
    if (async === undefined) {
      return originalOpenShort.call(this, method, url);
    }

    return originalOpenLong.call(this, method, url, async, username, password);
  };

  xhrPrototype.send = function (
    this: TrackedXMLHttpRequest,
    ...args: Parameters<typeof XMLHttpRequest.prototype.send>
  ) {
    if (!shouldTrackMethod(this[XHR_METHOD_KEY])) {
      return originalSend.apply(this, args);
    }

    beginTrackedRequest(store);
    const release = () => {
      this.removeEventListener('loadend', release);
      endTrackedRequest(store);
    };

    this.addEventListener('loadend', release);
    try {
      return originalSend.apply(this, args);
    } catch (error) {
      this.removeEventListener('loadend', release);
      endTrackedRequest(store);
      throw error;
    }
  };

  targetWindow[TRACKER_KEY] = store;
  return store;
}

export function attachSyncTracker(listener: TrackerListener): TrackerHandle {
  const targetWindow = getTrackingWindow();
  const store = ensureStore(targetWindow);

  store.listeners.add(listener);
  listener(createSnapshot(store));

  return {
    getSnapshot: () => createSnapshot(store),
    destroy: () => {
      store.listeners.delete(listener);
      if (store.listeners.size === 0) {
        teardownStore(targetWindow, store);
      }
    },
  };
}
