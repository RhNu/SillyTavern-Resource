import { createScriptIdDiv, teleportStyle } from '@util/script';
import { JSX } from 'react';
import { createRoot } from 'react-dom/client';

type ExtensionSettingSection = 'auto' | null | 2;

function getExtensionSettingSelector(section: Exclude<ExtensionSettingSection, 'auto'>): '#extensions_settings' | '#extensions_settings2' {
  return section === null ? '#extensions_settings' : '#extensions_settings2';
}

function countInlineDrawerDivs($container: JQuery<HTMLElement>) {
  return $container
    .find('div.inline-drawer')
    .filter((_, element) => $(element).parent().closest('div.inline-drawer').length === 0).length;
}

function pickExtensionSettingSection(): Exclude<ExtensionSettingSection, 'auto'> {
  const inlineDrawerCount = countInlineDrawerDivs($('#extensions_settings'));
  const inlineDrawerCount2 = countInlineDrawerDivs($('#extensions_settings2'));
  return inlineDrawerCount <= inlineDrawerCount2 ? null : 2;
}

export function mountExtensionSetting(element: JSX.Element, section: ExtensionSettingSection = 'auto') {
  const resolvedSection = section === 'auto' ? pickExtensionSettingSection() : section;
  const $appDiv = createScriptIdDiv().appendTo(getExtensionSettingSelector(resolvedSection));
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
