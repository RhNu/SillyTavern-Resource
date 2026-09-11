import { afterEach, describe, expect, test, vi } from 'vitest';
import { mountExtensionSettingsHost, resolveExtensionSettingsSection } from './host';

type FakeElement = {
  id: string;
  className: string;
  isConnected: boolean;
  parentElement: FakeContainer | null;
  attributes: Record<string, string>;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  remove(): void;
};

type FakeContainer = {
  isConnected: boolean;
  drawers: unknown[];
  append(element: FakeElement): void;
  contains(): boolean;
  querySelectorAll(): unknown[];
};

function createElement(): FakeElement {
  const element: FakeElement = {
    id: '',
    className: '',
    isConnected: false,
    parentElement: null,
    attributes: {},
    setAttribute(name, value) {
      element.attributes[name] = value;
    },
    getAttribute(name) {
      return element.attributes[name] ?? null;
    },
    remove: vi.fn(() => {
      element.isConnected = false;
      element.parentElement = null;
    }),
  };
  return element;
}

function createContainer(drawerCount: number): FakeContainer {
  const container: FakeContainer = {
    isConnected: true,
    drawers: Array.from({ length: drawerCount }, () => ({ parentElement: { closest: () => null } })),
    append(element) {
      element.parentElement = container;
      element.isConnected = container.isConnected;
    },
    contains: () => false,
    querySelectorAll() {
      return container.drawers;
    },
  };
  return container;
}

function createDocument(primary: FakeContainer | null, secondary: FakeContainer | null) {
  const targets = new Map<string, FakeContainer | null>([
    ['#extensions_settings', primary],
    ['#extensions_settings2', secondary],
  ]);
  return {
    targets,
    document: {
      defaultView: null,
      documentElement: {},
      createElement: vi.fn(() => createElement()),
      querySelector: vi.fn((selector: string) => targets.get(selector) ?? null),
    } as unknown as Document,
  };
}

let observerCallback: (() => void) | undefined;
const disconnect = vi.fn();

class FakeMutationObserver {
  constructor(callback: () => void) {
    observerCallback = callback;
  }
  observe = vi.fn();
  disconnect = disconnect;
}

afterEach(() => {
  observerCallback = undefined;
  disconnect.mockClear();
  vi.unstubAllGlobals();
});

describe('extension settings host', () => {
  test('chooses the less populated settings column', () => {
    const { document } = createDocument(createContainer(3), createContainer(1));
    expect(resolveExtensionSettingsSection(document)).toBe('secondary');
  });

  test('mounts, recovers after the settings DOM is rebuilt, and destroys once', () => {
    vi.stubGlobal('MutationObserver', FakeMutationObserver);
    const primary = createContainer(0);
    const replacement = createContainer(0);
    const { document, targets } = createDocument(primary, createContainer(2));
    const onMountChange = vi.fn();
    const session = mountExtensionSettingsHost({
      document,
      scriptId: 'script-1',
      id: 'settings-app',
      className: 'settings-host',
      section: 'primary',
      onMountChange,
    });

    expect(session.mounted).toBe(true);
    expect(session.element.parentElement).toBe(primary);
    expect(session.element.getAttribute('script_id')).toBe('script-1');

    primary.isConnected = false;
    (session.element as unknown as FakeElement).isConnected = false;
    targets.set('#extensions_settings', replacement);
    observerCallback?.();

    expect(session.mounted).toBe(true);
    expect(session.element.parentElement).toBe(replacement);

    session.destroy();
    session.destroy();
    expect(session.mounted).toBe(false);
    expect(session.element.remove).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(onMountChange).toHaveBeenNthCalledWith(1, true);
    expect(onMountChange).toHaveBeenLastCalledWith(false);
  });
});
