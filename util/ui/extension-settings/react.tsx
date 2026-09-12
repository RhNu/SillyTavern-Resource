import { mountExtensionSettingsHost } from './host';
import type { ExtensionSettingsHostOptions, ExtensionSettingsHostSession } from './types';
import { teleportStyle } from '@util/tavern-helper/script/styles';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

export type ReactExtensionSettingsSession = ExtensionSettingsHostSession;

export type MountReactExtensionSettingsOptions = ExtensionSettingsHostOptions & {
  teleportStyles?: boolean;
};

export function mountReactExtensionSettings(
  element: ReactNode,
  options: MountReactExtensionSettingsOptions = {},
): ReactExtensionSettingsSession {
  const { teleportStyles = true, ...hostOptions } = options;
  const host = mountExtensionSettingsHost(hostOptions);
  let root: ReturnType<typeof createRoot> | undefined;
  let styleSession: ReturnType<typeof teleportStyle> | undefined;
  let destroyed = false;

  try {
    root = createRoot(host.element);
    styleSession = teleportStyles ? teleportStyle() : undefined;
    root.render(element);
  } catch (error) {
    root?.unmount();
    host.destroy();
    styleSession?.destroy();
    throw error;
  }

  return {
    element: host.element,
    section: host.section,
    get mounted() {
      return host.mounted;
    },
    mount: host.mount,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root?.unmount();
      host.destroy();
      styleSession?.destroy();
    },
  };
}
