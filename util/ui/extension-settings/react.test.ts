import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mountHost: vi.fn(),
  teleportStyle: vi.fn(),
  render: vi.fn(),
  unmount: vi.fn(),
  createRoot: vi.fn(),
  destroyHost: vi.fn(),
  destroyStyle: vi.fn(),
}));

vi.mock('./host', () => ({ mountExtensionSettingsHost: mocks.mountHost }));
vi.mock('@util/tavern-helper/script/styles', () => ({ teleportStyle: mocks.teleportStyle }));
vi.mock('react-dom/client', () => ({ createRoot: mocks.createRoot }));

import { mountReactExtensionSettings } from './react';

function stubAdapters() {
  const element = {} as HTMLDivElement;
  mocks.mountHost.mockReturnValue({
    element,
    section: 'primary',
    mounted: true,
    mount: vi.fn(() => true),
    destroy: mocks.destroyHost,
  });
  mocks.teleportStyle.mockReturnValue({ destroy: mocks.destroyStyle });
  mocks.createRoot.mockReturnValue({ render: mocks.render, unmount: mocks.unmount });
  return { element };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('mountReactExtensionSettings', () => {
  test('mounts React and destroys every owned resource exactly once', () => {
    const { element } = stubAdapters();
    const session = mountReactExtensionSettings('settings', { section: 'primary' });

    expect(mocks.mountHost).toHaveBeenCalledWith({ section: 'primary' });
    expect(mocks.createRoot).toHaveBeenCalledWith(element);
    expect(mocks.render).toHaveBeenCalledWith('settings');

    session.destroy();
    session.destroy();

    expect(mocks.unmount).toHaveBeenCalledOnce();
    expect(mocks.destroyHost).toHaveBeenCalledOnce();
    expect(mocks.destroyStyle).toHaveBeenCalledOnce();
  });

  test('cleans up when the initial render throws', () => {
    stubAdapters();
    mocks.render.mockImplementationOnce(() => {
      throw new Error('render failed');
    });

    expect(() => mountReactExtensionSettings(null)).toThrow('render failed');
    expect(mocks.unmount).toHaveBeenCalledOnce();
    expect(mocks.destroyHost).toHaveBeenCalledOnce();
    expect(mocks.destroyStyle).toHaveBeenCalledOnce();
  });

  test('can opt out of style teleportation', () => {
    stubAdapters();
    const session = mountReactExtensionSettings(null, { teleportStyles: false });
    session.destroy();
    expect(mocks.teleportStyle).not.toHaveBeenCalled();
  });
});
