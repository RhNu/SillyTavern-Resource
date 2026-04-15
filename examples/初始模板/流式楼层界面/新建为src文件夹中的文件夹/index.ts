import { mountStreamingMessages } from '@util/streaming';
import { createElement } from 'react';
import App from './App';

$(() => {
  const { unmount } = mountStreamingMessages(() => createElement(App));
  $(window).on('pagehide', () => unmount());
});
