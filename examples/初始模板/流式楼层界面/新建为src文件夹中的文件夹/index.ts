import { mountStreamingMessages } from '@util/ui/streaming-messages/mount';
import { createElement } from 'react';
import App from './App';

$(() => {
  const { unmount } = mountStreamingMessages(() => createElement(App));
  $(window).on('pagehide', () => unmount());
});
