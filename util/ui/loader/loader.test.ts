import { afterEach, describe, expect, expectTypeOf, test, vi } from 'vitest';
import { showLoader, withLoader } from './loader';
import type { NativeLoaderHandle, NativeLoaderOptions } from './native-types';

class FakeLoaderHandle implements NativeLoaderHandle {
  readonly id = 'loader-1';
  readonly slug: string | null;
  readonly isBlocking: boolean;
  isActive = true;
  readonly stop = vi.fn(async () => {
    if (!this.isActive) return;
    await this.options.onStop?.();
    this.isActive = false;
  });
  readonly hide = vi.fn(async () => {
    if (!this.isActive) return;
    await this.options.onHide?.();
    this.isActive = false;
  });

  constructor(readonly options: NativeLoaderOptions) {
    this.slug = options.slug ?? null;
    this.isBlocking = options.blocking ?? true;
  }
}

function stubLoaderApi() {
  let handle: FakeLoaderHandle | undefined;
  const show = vi.fn((options: NativeLoaderOptions = {}) => {
    handle = new FakeLoaderHandle(options);
    return handle;
  });
  vi.stubGlobal('SillyTavern', {
    loader: {
      show,
      hide: vi.fn(),
      active: vi.fn(),
      get: vi.fn(),
      isBlocking: vi.fn(),
      ToastMode: { NONE: 'none', STATIC: 'static', STOPPABLE: 'stoppable' },
      Handle: FakeLoaderHandle,
      createOverlay: vi.fn(),
    },
  });
  return {
    show,
    get handle() {
      return handle!;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('action loader bridge', () => {
  test('maps options and aborts the session when stopped', async () => {
    const stubs = stubLoaderApi();
    const onStop = vi.fn();
    const session = showLoader({
      blocking: false,
      toast: 'static',
      slug: 'sync',
      message: 'Syncing',
      onStop,
    });

    expectTypeOf(session.signal).toEqualTypeOf<AbortSignal>();
    expect(stubs.show).toHaveBeenCalledWith(
      expect.objectContaining({ blocking: false, toastMode: 'static', slug: 'sync', message: 'Syncing' }),
    );
    expect(stubs.show.mock.calls[0][0]).not.toHaveProperty('toast');

    await session.stop();
    await session.stop();

    expect(session.signal.aborted).toBe(true);
    expect(session.signal.reason).toBeInstanceOf(DOMException);
    expect(session.state).toBe('stopped');
    expect(onStop).toHaveBeenCalledOnce();
    expect(stubs.handle.stop).toHaveBeenCalledOnce();
  });

  test('runs tasks and always hides the loader', async () => {
    const stubs = stubLoaderApi();
    await expect(withLoader({ message: 'Working' }, async session => ({ id: session.id }))).resolves.toEqual({
      id: 'loader-1',
    });
    expect(stubs.handle.hide).toHaveBeenCalledOnce();
    expect(stubs.handle.options.toastMode).toBe('stoppable');
  });

  test('hides the loader when the task rejects', async () => {
    const stubs = stubLoaderApi();
    await expect(
      withLoader({}, () => {
        throw new Error('failed');
      }),
    ).rejects.toThrow('failed');
    expect(stubs.handle.hide).toHaveBeenCalledOnce();
  });
});
