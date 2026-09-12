import { getHostDocument } from './host';

export type TemporaryHostOptions = {
  document?: Document;
  id?: string;
  className?: string;
  attributes?: Record<string, string>;
  scriptId?: string;
  onDisconnected?: () => void;
};

export type TemporaryHostSession = {
  readonly element: HTMLDivElement;
  readonly destroyed: boolean;
  destroy(): void;
};

export function createTemporaryHost(options: TemporaryHostOptions = {}): TemporaryHostSession {
  const doc = options.document ?? getHostDocument();
  const element = doc.createElement('div');
  element.setAttribute('script_id', options.scriptId ?? getScriptId());
  if (options.id) element.id = options.id;
  if (options.className) element.className = options.className;
  for (const [name, value] of Object.entries(options.attributes ?? {})) element.setAttribute(name, value);

  let destroyed = false;
  let wasConnected = element.isConnected;
  const Observer = doc.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(() => {
    if (destroyed) return;
    if (element.isConnected) {
      wasConnected = true;
      return;
    }
    if (!wasConnected) return;
    destroy();
    options.onDisconnected?.();
  });
  observer.observe(doc.documentElement, { childList: true, subtree: true });

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    observer.disconnect();
    element.remove();
  };

  return {
    element,
    get destroyed() {
      return destroyed;
    },
    destroy,
  };
}
