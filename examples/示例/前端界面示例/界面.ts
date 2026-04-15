import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Diary from './日记';
import RoleplayOptions from './选择框';

function RoleplayOptionsPage() {
  const message = getChatMessages(getCurrentMessageId())[0]?.message ?? '';
  return createElement(RoleplayOptions, { message });
}

const router = createMemoryRouter(
  [
    { path: '/日记', element: createElement(Diary) },
    { path: '/选择框', element: createElement(RoleplayOptionsPage) },
  ],
  { initialEntries: ['/日记'] },
);

$(() => {
  const app = document.querySelector('#app');
  if (!app) {
    return;
  }

  const root = createRoot(app);
  root.render(createElement(RouterProvider, { router }));
  $(window).on('pagehide', () => root.unmount());
});
