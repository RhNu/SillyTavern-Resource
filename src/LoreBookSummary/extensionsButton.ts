import { BUTTON_CONTAINER_ID, BUTTON_ID } from './constants';

export const ensureExtensionsButton = (parent$: JQueryStatic, onClick: () => void): boolean => {
  const menu = parent$('#extensionsMenu');
  if (!menu.length) {
    return false;
  }

  let container = parent$(`#${BUTTON_CONTAINER_ID}`);
  if (!container.length) {
    container = parent$(
      `<div id="${BUTTON_CONTAINER_ID}" class="extension_container interactable" tabindex="0">
        <div id="${BUTTON_ID}" class="list-group-item flex-container flexGap5 interactable" title="世界书统计" tabindex="0" role="listitem">
          <div class="fa-fw fa-solid fa-book-open-reader extensionsMenuExtensionButton"></div>
          <span data-i18n="Worldbook Stats">世界书统计</span>
        </div>
      </div>`,
    );
    menu.append(container);
  }

  const button = parent$(`#${BUTTON_ID}`);
  button.off('click').on('click', event => {
    event.preventDefault();
    event.stopPropagation();
    void onClick();
  });

  return true;
};
