import { createScriptIdDiv, teleportStyle } from '@util/script';
import { JSX } from 'react';
import { createRoot } from 'react-dom/client';

type ExtensionSettingSection = 1 | 2;

export function mountExtensionSetting(element: JSX.Element, section: ExtensionSettingSection = 2) {
  const $appDiv = createScriptIdDiv().appendTo(`#extensions_settings${section}`);
  const appRoot = createRoot($appDiv[0]);
  appRoot.render(element);

  const { destroy: destroyStyle } = teleportStyle();

  return {
    destroy: () => {
      appRoot.unmount();
      $appDiv.remove();
      destroyStyle();
    },
  };
}
