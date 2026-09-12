import { afterEach, describe, expect, test, vi } from 'vitest';
import type { NativePopupInstance, NativePopupOptions, NativePopupValue } from './native-types';

const reactRootMocks = vi.hoisted(() => ({
  render: vi.fn(),
  unmount: vi.fn(),
  createRoot: vi.fn(),
}));

vi.mock('react-dom/client', () => ({ createRoot: reactRootMocks.createRoot }));

import { openReactPopup } from './react';

type FakeElement = {
  id: string;
  className: string;
  style: Record<string, string>;
  children: unknown[];
  textContent: string;
  innerHTML: string;
  append: (...children: unknown[]) => void;
  remove: () => void;
  setAttribute: (name: string, value: string) => void;
};

function createFakeElement(): FakeElement {
  const element: FakeElement = {
    id: '',
    className: '',
    style: {},
    children: [],
    textContent: '',
    innerHTML: '',
    append(...children) {
      element.children.push(...children);
    },
    remove: vi.fn(),
    setAttribute: vi.fn(),
  };
  return element;
}

class FakePopup implements NativePopupInstance {
  readonly id = 'popup-id';
  readonly dlg = createFakeElement() as unknown as HTMLDialogElement;
  readonly body = createFakeElement() as unknown as HTMLDivElement;
  readonly content = createFakeElement() as unknown as HTMLDivElement;
  readonly mainInput = createFakeElement() as unknown as HTMLTextAreaElement;
  readonly inputControls = createFakeElement() as unknown as HTMLDivElement;
  readonly buttonControls = createFakeElement() as unknown as HTMLDivElement;
  readonly okButton = createFakeElement() as unknown as HTMLDivElement;
  readonly cancelButton = createFakeElement() as unknown as HTMLDivElement;
  readonly closeButton = createFakeElement() as unknown as HTMLDivElement;
  result?: number | null;
  value?: NativePopupValue;
  inputResults?: Map<string, string | boolean>;
  private resolver?: (value: NativePopupValue) => void;

  constructor(
    readonly popupContent: JQuery<HTMLElement> | string | Element,
    readonly type: number,
    readonly inputValue = '',
    readonly options: NativePopupOptions = {},
  ) {}

  show(): Promise<NativePopupValue> {
    void this.options.onOpen?.(this);
    return new Promise(resolve => {
      this.resolver = resolve;
    });
  }

  async complete(result: number | null): Promise<NativePopupValue | undefined> {
    this.result = result;
    this.value = result;
    if ((await this.options.onClosing?.(this)) === false) return undefined;
    await this.options.onClose?.(this);
    this.resolver?.(this.value);
    return this.value;
  }

  completeAffirmative(): Promise<NativePopupValue | undefined> {
    return this.complete(1);
  }

  completeNegative(): Promise<NativePopupValue | undefined> {
    return this.complete(0);
  }

  completeCancelled(): Promise<NativePopupValue | undefined> {
    return this.complete(null);
  }
}

function stubPopupEnvironment() {
  const fakeDocument = { createElement: vi.fn(() => createFakeElement()) };
  const fakeWindow = {} as Window;
  Object.assign(fakeWindow, { parent: fakeWindow, document: fakeDocument });
  vi.stubGlobal('window', fakeWindow);
  vi.stubGlobal('document', fakeDocument);
  vi.stubGlobal('SillyTavern', {
    Popup: FakePopup,
    POPUP_TYPE: { TEXT: 1, CONFIRM: 2, INPUT: 3, DISPLAY: 4, CROP: 5 },
    POPUP_RESULT: { AFFIRMATIVE: 1, NEGATIVE: 0, CANCELLED: null },
  });
  reactRootMocks.createRoot.mockReturnValue({ render: reactRootMocks.render, unmount: reactRootMocks.unmount });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('openReactPopup', () => {
  test('mounts into the host document and cleans up exactly once', async () => {
    stubPopupEnvironment();
    const onClose = vi.fn();
    let renderedSession: unknown;
    const session = openReactPopup({
      id: 'settings-popup',
      className: 'settings-host',
      attributes: { 'data-owner': 'test' },
      render: current => {
        renderedSession = current;
        return null;
      },
      onClose,
    });

    expect(reactRootMocks.createRoot).toHaveBeenCalledWith(session.host);
    expect(reactRootMocks.render).toHaveBeenCalledOnce();
    expect(renderedSession).toBe(session);
    expect(session.host.id).toBe('settings-popup');
    expect(session.host.className).toBe('settings-host');

    await session.cancel();
    await session.cancel();
    await session.closed;

    expect(reactRootMocks.unmount).toHaveBeenCalledOnce();
    expect(session.host.remove).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('cancels the native popup when rendering fails', async () => {
    stubPopupEnvironment();
    reactRootMocks.render.mockImplementationOnce(() => {
      throw new Error('render failed');
    });

    expect(() => openReactPopup({ render: () => null })).toThrow('render failed');
    await Promise.resolve();
    expect(reactRootMocks.unmount).toHaveBeenCalledOnce();
  });
});
