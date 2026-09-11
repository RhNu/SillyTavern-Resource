import { mountReactExtensionSettings } from '@util/react/extension-settings';
import { createScriptIdDiv } from '@util/script';
import type { JSX } from 'react';

type ExtensionSettingSection = 'auto' | null | 2;

export function mountExtensionSetting(element: JSX.Element, section: ExtensionSettingSection = 'auto') {
  return mountReactExtensionSettings(element, {
    section: section === 'auto' ? 'auto' : section === null ? 'primary' : 'secondary',
  });
}

export type CreateTemporaryHostOptions = {
  doc?: Document;
  id?: string;
  className?: string;
  attributes?: Record<string, string>;
  onDisconnected?: () => void;
};

/**
 * Creates a temporary script host for popup-like content and watches for external removal.
 *
 * Scope:
 * - Use for transient DOM hosts owned by popup systems that may detach the node outside the caller.
 *
 * Non-scope:
 * - Does not abstract any popup API or render framework lifecycle.
 */
export function createTemporaryHost(options: CreateTemporaryHostOptions = {}) {
  const doc = options.doc ?? document;
  const $host = createScriptIdDiv();

  if (options.id) {
    $host.attr('id', options.id);
  }

  if (options.className) {
    $host.addClass(options.className);
  }

  Object.entries(options.attributes ?? {}).forEach(([key, value]) => {
    $host.attr(key, value);
  });

  const root = doc.body ?? doc.documentElement;
  let destroyed = false;
  const observer = new MutationObserver(() => {
    if (destroyed || !$host[0] || $host[0].isConnected) {
      return;
    }

    destroyed = true;
    observer.disconnect();
    options.onDisconnected?.();
  });
  observer.observe(root, { childList: true, subtree: true });

  return {
    $host,
    element: $host[0],
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      observer.disconnect();
      $host.remove();
    },
  };
}
