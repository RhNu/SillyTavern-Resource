import { getHostDocument } from '@util/st/dom/host';
import { popup } from './builder';
import type { PopupPresentationOptions, PopupSession } from './types';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

export type ReactPopupSession = PopupSession<Record<never, never>, never> & { readonly host: HTMLDivElement };

export type OpenReactPopupOptions = {
  title?: string;
  id?: string;
  className?: string;
  attributes?: Record<string, string>;
  popup?: PopupPresentationOptions;
  render: (session: ReactPopupSession) => ReactNode;
  onClose?: () => void | Promise<void>;
};

export function openReactPopup(options: OpenReactPopupOptions): ReactPopupSession {
  const host = getHostDocument().createElement('div');
  if (options.id) host.id = options.id;
  if (options.className) host.className = options.className;
  for (const [name, value] of Object.entries(options.attributes ?? {})) host.setAttribute(name, value);

  let root: ReturnType<typeof createRoot> | undefined;
  let cleaned = false;
  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    root?.unmount();
    host.remove();
    try {
      await options.onClose?.();
    } catch (error) {
      console.error('React popup onClose callback failed.', error);
    }
  };

  const builder = popup(host)
    .display()
    .options(options.popup ?? {})
    .onClose(cleanup);
  if (options.title) builder.title(options.title);

  let session: ReactPopupSession | undefined;
  try {
    session = Object.assign(builder.open(), { host });
    root = createRoot(host);
    root.render(options.render(session));
    void session.closed.catch(async () => await cleanup());
    return session;
  } catch (error) {
    void session?.cancel().catch(() => undefined);
    void cleanup();
    throw error;
  }
}
