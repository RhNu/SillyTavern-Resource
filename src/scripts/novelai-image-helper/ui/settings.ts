import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { NovelAiImageService } from '../app/service';
import SettingsPanel from './SettingsPanel';

let closeActivePopup: (() => void) | undefined;

export function openSettings(service: NovelAiImageService): void {
  closeActivePopup?.();

  const $host = $('<div class="nai-settings-host">');
  const root = createRoot($host[0]);
  const popup = new SillyTavern.Popup($host[0], SillyTavern.POPUP_TYPE.DISPLAY, '', {
    wide: true,
    wider: true,
    okButton: false,
    cancelButton: false,
  });
  let closed = false;

  const close = () => {
    if (!closed) void popup.completeCancelled();
  };
  closeActivePopup = close;
  root.render(createElement(SettingsPanel, { service, onClose: close }));

  void popup.show().finally(() => {
    closed = true;
    if (closeActivePopup === close) closeActivePopup = undefined;
    root.unmount();
    $host.remove();
  });
}
