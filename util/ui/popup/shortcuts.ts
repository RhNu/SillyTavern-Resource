import { getHostDocument } from '@util/st/dom/host';
import { getSillyTavernPopupApi } from './native';
import { popup } from './builder';
import type { PopupContent, PopupPresentationOptions, PopupSession } from './types';

type PopupShortcutOptions = {
  title?: string;
  content?: PopupContent;
  popup?: PopupPresentationOptions;
};

export type ConfirmPopupOptions = PopupShortcutOptions & {
  okLabel?: string;
  cancelLabel?: string;
};

export async function confirmPopup(options: ConfirmPopupOptions): Promise<boolean> {
  const api = getSillyTavernPopupApi();
  const native = new api.Popup(createShortcutContent(options.title, options.content), api.POPUP_TYPE.CONFIRM, '', {
    ...options.popup,
    okButton: options.okLabel,
    cancelButton: options.cancelLabel,
  });
  return (await native.show()) === api.POPUP_RESULT.AFFIRMATIVE;
}

export type InputPopupOptions = PopupShortcutOptions & {
  defaultValue?: string;
  okLabel?: string;
  cancelLabel?: string;
  rows?: number;
  placeholder?: string;
};

export async function inputPopup(options: InputPopupOptions): Promise<string | null> {
  const api = getSillyTavernPopupApi();
  const native = new api.Popup(
    createShortcutContent(options.title, options.content),
    api.POPUP_TYPE.INPUT,
    options.defaultValue ?? '',
    {
      ...options.popup,
      okButton: options.okLabel,
      cancelButton: options.cancelLabel,
      rows: options.rows,
      placeholder: options.placeholder,
    },
  );
  const value = await native.show();
  return typeof value === 'string' ? value : null;
}

function createShortcutContent(title: string | undefined, popupContent: PopupContent | undefined): HTMLElement {
  const doc = getHostDocument();
  const content = doc.createElement('div');
  if (title) {
    const heading = doc.createElement('h3');
    heading.textContent = title;
    content.append(heading);
  }
  if (typeof popupContent === 'string') {
    const text = doc.createElement('div');
    text.style.whiteSpace = 'pre-wrap';
    text.textContent = popupContent;
    content.append(text);
  } else if (popupContent && 'jquery' in popupContent) {
    content.append(...popupContent.toArray());
  } else if (popupContent) {
    content.append(popupContent);
  }
  return content;
}

export function displayPopup(options: PopupShortcutOptions): PopupSession<Record<never, never>, never> {
  const builder = popup(options.content)
    .display()
    .options(options.popup ?? {});
  if (options.title) builder.title(options.title);
  return builder.open();
}
