import { createScriptIdDiv, teleportStyle } from '@util/script';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import 界面 from './设置界面组件';

$(() => {
  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  const root = createRoot($app[0]);
  root.render(createElement(界面));

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    root.unmount();
    $app.remove();
    destroy();
  });
});
