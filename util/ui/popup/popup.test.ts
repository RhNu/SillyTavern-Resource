import { afterEach, describe, expect, expectTypeOf, test, vi } from 'vitest';
import { popup } from './builder';
import type { NativePopupInstance, NativePopupOptions, NativePopupValue } from './native-types';

type FakeElement = {
  style: Record<string, string>;
  children: unknown[];
  textContent: string;
  innerHTML: string;
  append: (...children: unknown[]) => void;
  remove: () => void;
};

function createFakeElement(): FakeElement {
  const element: FakeElement = {
    style: {},
    children: [],
    textContent: '',
    innerHTML: '',
    append(...children) {
      element.children.push(...children);
    },
    remove: vi.fn(),
  };
  return element;
}

class FakePopup implements NativePopupInstance {
  readonly type: number;
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
    type: number,
    readonly inputValue = '',
    readonly options: NativePopupOptions = {},
  ) {
    this.type = type;
  }

  async show(): Promise<NativePopupValue> {
    await this.options.onOpen?.(this);
    return await new Promise(resolve => {
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
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PopupBuilder', () => {
  test('infers fields and semantic actions', () => {
    const builder = popup('content')
      .checkbox('removeFile', { label: 'Remove file' })
      .textField('name', { label: 'Name' })
      .numberField('count', { label: 'Count' })
      .action('save', { label: 'Save' });

    const checkOutcome = async () => {
      const outcome = await builder.show();
      expectTypeOf(outcome.fields).toEqualTypeOf<{ removeFile: boolean; name: string; count: number | null }>();
      if (outcome.status === 'completed') expectTypeOf(outcome.action).toEqualTypeOf<'save'>();
    };
    expectTypeOf(checkOutcome).toBeFunction();
  });

  test('normalizes fields and maps native button results to action keys', async () => {
    stubPopupEnvironment();
    const beforeClose = vi.fn();
    const session = popup('content')
      .checkbox('enabled', { label: 'Enabled', defaultValue: false })
      .textField('name', { label: 'Name' })
      .numberField('count', { label: 'Count', min: 1 })
      .action('save', { label: 'Save', primary: true })
      .beforeClose(beforeClose)
      .open();
    const native = session.native as FakePopup;
    native.inputResults = new Map<string, string | boolean>([
      ['enabled', true],
      ['name', 'demo'],
      ['count', '3'],
    ]);

    await session.close('save');

    await expect(session.closed).resolves.toEqual({
      status: 'completed',
      action: 'save',
      fields: { enabled: true, name: 'demo', count: 3 },
    });
    expect(beforeClose).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'save', fields: { enabled: true, name: 'demo', count: 3 } }),
    );
    expect(native.options.defaultResult).toBe(1001);
    expect(native.options.okButton).toBe(false);
    expect(native.options.cancelButton).toBe(false);
  });

  test('only an explicit false return prevents closing', async () => {
    stubPopupEnvironment();
    const beforeClose = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(undefined);
    const session = popup('content').action('continue', { label: 'Continue' }).beforeClose(beforeClose).open();

    await session.close('continue');
    expect(session.isClosed).toBe(false);
    await session.close('continue');
    await session.closed;
    expect(session.isClosed).toBe(true);
  });

  test('rejects duplicate fields and actions', () => {
    expect(() => popup().checkbox('same', { label: 'One' }).checkbox('same', { label: 'Two' })).toThrow(
      'already defined',
    );
    expect(() => popup().action('same', { label: 'One' }).action('same', { label: 'Two' })).toThrow('already defined');
  });
});
