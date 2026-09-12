import { getSillyTavernLoaderApi, updateSillyTavernLoaderToast } from './native';
import type { LoaderOptions, LoaderSession, LoaderState } from './types';

function createAbortReason(): Error {
  return new DOMException('The action loader was stopped by the user.', 'AbortError');
}

export function showLoader(options: LoaderOptions = {}): LoaderSession {
  const api = getSillyTavernLoaderApi();
  const { toast, onStop, onHide, ...nativeOptions } = options;
  const abortController = new AbortController();
  let state: LoaderState = 'active';
  let operation: Promise<void> | undefined;

  const native = api.show({
    ...nativeOptions,
    toastMode: toast ?? api.ToastMode.STOPPABLE,
    onStop: async () => {
      state = 'stopping';
      if (!abortController.signal.aborted) abortController.abort(createAbortReason());
      try {
        await onStop?.(session);
      } finally {
        state = 'stopped';
      }
    },
    onHide: async () => {
      state = 'hiding';
      try {
        await onHide?.(session);
      } finally {
        state = 'hidden';
      }
    },
  });

  const runOnce = (kind: 'stop' | 'hide'): Promise<void> => {
    if (operation) return operation;
    if (!native.isActive) {
      if (state === 'active') state = kind === 'stop' ? 'stopped' : 'hidden';
      return Promise.resolve();
    }
    operation = native[kind]().catch(error => {
      operation = undefined;
      throw error;
    });
    return operation;
  };

  const session: LoaderSession = {
    native,
    get id() {
      return native.id;
    },
    get slug() {
      return native.slug;
    },
    get blocking() {
      return native.isBlocking;
    },
    get active() {
      return native.isActive;
    },
    get state() {
      return state;
    },
    signal: abortController.signal,
    update: options => {
      if (native.isActive && state === 'active' && native.id) updateSillyTavernLoaderToast(native.id, options);
    },
    stop: () => runOnce('stop'),
    hide: () => runOnce('hide'),
  };
  return session;
}

export async function withLoader<TResult>(
  options: LoaderOptions,
  task: (session: LoaderSession) => TResult | Promise<TResult>,
): Promise<TResult> {
  const session = showLoader(options);
  try {
    return await task(session);
  } finally {
    await session.hide();
  }
}
