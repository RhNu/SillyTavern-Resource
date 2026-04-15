import { waitUntil } from 'async-wait-until';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './global.css';

$(async () => {
  await waitGlobalInitialized('Mvu');
  await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));

  const app = document.querySelector('#app');
  if (!app) {
    return;
  }

  const root = createRoot(app);
  root.render(createElement(App));
  $(window).on('pagehide', () => root.unmount());
});
