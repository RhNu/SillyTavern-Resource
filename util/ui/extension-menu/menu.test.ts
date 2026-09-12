import { afterEach, describe, expect, expectTypeOf, test, vi } from 'vitest';
import { extensionMenuItem } from './builder';
import { mountExtensionMenuItem } from './menu';

class FakeClassList {
  readonly values = new Set<string>();
  add(...classNames: string[]) {
    classNames.forEach(className => this.values.add(className));
  }
  toggle(className: string, force: boolean) {
    if (force) this.values.add(className);
    else this.values.delete(className);
  }
  contains(className: string) {
    return this.values.has(className);
  }
}

class FakeElement {
  id = '';
  title = '';
  tabIndex = 0;
  hidden = false;
  isConnected = false;
  parentElement: FakeElement | null = null;
  textContent = '';
  readonly children: FakeElement[] = [];
  readonly classList = new FakeClassList();
  readonly attributes = new Map<string, string>();
  private readonly listeners = new Map<string, Set<(event: MouseEvent) => unknown>>();

  append(...children: FakeElement[]) {
    children.forEach(child => {
      child.parentElement = this;
      child.setConnected(this.isConnected);
      this.children.push(child);
    });
  }

  remove() {
    this.parentElement?.children.splice(this.parentElement.children.indexOf(this), 1);
    this.parentElement = null;
    this.setConnected(false);
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type: string, listener: (event: MouseEvent) => unknown) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: MouseEvent) => unknown) {
    this.listeners.get(type)?.delete(listener);
  }

  async emit(type: string, event: MouseEvent) {
    await Promise.all([...(this.listeners.get(type) ?? [])].map(listener => listener(event)));
  }

  setConnected(connected: boolean) {
    this.isConnected = connected;
    this.children.forEach(child => child.setConnected(connected));
  }
}

function findById(root: FakeElement, id: string): FakeElement | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const match = findById(child, id);
    if (match) return match;
  }
  return null;
}

function createEnvironment() {
  let menu = new FakeElement();
  menu.id = 'extensionsMenu';
  menu.setConnected(true);
  const created: FakeElement[] = [];
  const doc = {
    defaultView: null,
    documentElement: {},
    createElement: vi.fn(() => {
      const element = new FakeElement();
      created.push(element);
      return element;
    }),
    querySelector: vi.fn((selector: string) => (selector === '#extensionsMenu' ? menu : null)),
    getElementById: vi.fn((id: string) => findById(menu, id) ?? created.find(element => element.id === id) ?? null),
  } as unknown as Document;
  return {
    doc,
    get menu() {
      return menu;
    },
    replaceMenu() {
      menu.setConnected(false);
      menu = new FakeElement();
      menu.id = 'extensionsMenu';
      menu.setConnected(true);
    },
  };
}

let observerCallback: (() => void) | undefined;
const disconnectObserver = vi.fn();

class FakeMutationObserver {
  constructor(callback: () => void) {
    observerCallback = callback;
  }
  observe = vi.fn();
  disconnect = disconnectObserver;
}

function createClickEvent(): MouseEvent {
  return { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent;
}

afterEach(() => {
  observerCallback = undefined;
  disconnectObserver.mockClear();
  vi.unstubAllGlobals();
});

describe('extension menu item', () => {
  test('requires a click handler before mounting at compile time', () => {
    const checkBuilder = () => {
      const incomplete = extensionMenuItem('demo').label('Demo').icon('fa-solid fa-wand-magic-sparkles');
      // @ts-expect-error mount is unavailable until onClick establishes the callback contract.
      incomplete.mount();
      const complete = incomplete.onClick(() => undefined);
      expectTypeOf(complete.mount).toBeFunction();
    };
    expectTypeOf(checkBuilder).toBeFunction();
  });

  test('mounts with safe DOM construction and restores itself after menu replacement', () => {
    vi.stubGlobal('MutationObserver', FakeMutationObserver);
    const environment = createEnvironment();
    const onMountChange = vi.fn();
    const session = mountExtensionMenuItem({
      id: 'demo',
      containerId: 'demo-container',
      label: 'Demo',
      title: 'Demo action',
      iconClass: 'fa-solid fa-wand-magic-sparkles',
      document: environment.doc,
      onClick: () => undefined,
      onMountChange,
    });

    expect(session.mounted).toBe(true);
    expect(session.container.parentElement).toBe(environment.menu);
    expect(session.element.textContent).not.toContain('<');
    expect(session.element.getAttribute('role')).toBe('listitem');

    environment.replaceMenu();
    observerCallback?.();
    expect(session.container.parentElement).toBe(environment.menu);

    session.destroy();
    session.destroy();
    expect(disconnectObserver).toHaveBeenCalledOnce();
    expect(onMountChange).toHaveBeenLastCalledWith(false);
  });

  test('prevents duplicate async clicks and reflects pending state', async () => {
    vi.stubGlobal('MutationObserver', FakeMutationObserver);
    const environment = createEnvironment();
    let finish!: () => void;
    const onClick = vi.fn(() => new Promise<void>(resolve => (finish = resolve)));
    const session = mountExtensionMenuItem({
      id: 'async-demo',
      label: 'Async demo',
      iconClass: 'fa-solid fa-spinner',
      document: environment.doc,
      onClick,
    });

    const firstClick = (session.element as unknown as FakeElement).emit('click', createClickEvent());
    const secondClick = (session.element as unknown as FakeElement).emit('click', createClickEvent());
    expect(onClick).toHaveBeenCalledOnce();
    expect(session.pending).toBe(true);
    expect(session.element.getAttribute('aria-busy')).toBe('true');

    finish();
    await Promise.all([firstClick, secondClick]);
    expect(session.pending).toBe(false);
    expect(session.element.getAttribute('aria-busy')).toBe('false');
  });
});
