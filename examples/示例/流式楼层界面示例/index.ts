import { mountStreamingMessages } from '@util/ui/streaming-messages/mount';
import { createElement } from 'react';
import App from './App';

$(() => {
  const { unmount } = mountStreamingMessages(() => createElement(App), { host: 'div' });
  $(window).on('pagehide', () => unmount());
});
