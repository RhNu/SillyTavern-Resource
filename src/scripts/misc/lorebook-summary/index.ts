import { openPanel } from './actions';
import { extensionMenuItem } from '@util/st/ui/extension-menu/builder';
import { BUTTON_CONTAINER_ID, BUTTON_ID } from './constants';

const init = (): void => {
  console.info('[WorldbookTokenStats] Initializing.');

  const menuButton = extensionMenuItem(BUTTON_ID)
    .containerId(BUTTON_CONTAINER_ID)
    .title('世界书统计')
    .label('世界书统计')
    .icon('fa-fw fa-solid fa-book-open-reader')
    .onMountChange(mounted => {
      if (mounted) console.info('[WorldbookTokenStats] Extensions menu button ready.');
    })
    .onClick(openPanel)
    .mount();

  $(window).on('pagehide', () => {
    console.info('[WorldbookTokenStats] Cleanup.');
    menuButton.destroy();
  });
};

$(() => {
  errorCatched(init)();
});
