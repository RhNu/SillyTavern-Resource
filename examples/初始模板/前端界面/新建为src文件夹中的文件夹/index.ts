import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

$(() => {
  const app = document.querySelector('#app');
  if (!app) {
    return;
  }

  const root = createRoot(app);
  root.render(createElement(App));
  $(window).on('pagehide', () => root.unmount());
});
