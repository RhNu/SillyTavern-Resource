import iframe_srcdoc from './iframe_srcdoc.html?raw';

export async function loadReadme(url: string): Promise<boolean> {
  const readme = await fetch(url);
  if (!readme.ok) {
    return false;
  }
  const readme_text = await readme.text();
  replaceScriptInfo(readme_text);
  return true;
}

export function teleportStyle(
  append_to: JQuery.Selector | JQuery.htmlString | JQuery.TypeOrArray<Element | DocumentFragment> | JQuery = 'head',
): { destroy: () => void } {
  const $div = $(`<div>`)
    .attr('script_id', getScriptId())
    .append($(`head > style`, document).clone())
    .appendTo(append_to);

  return {
    destroy: () => $div.remove(),
  };
}

export function createScriptIdIframe(): JQuery<HTMLIFrameElement> {
  return $(`<iframe>`).attr({
    script_id: getScriptId(),
    frameborder: 0,
    srcdoc: iframe_srcdoc,
  }) as JQuery<HTMLIFrameElement>;
}

export function createScriptIdDiv(): JQuery<HTMLDivElement> {
  return $('<div>').attr('script_id', getScriptId()) as JQuery<HTMLDivElement>;
}

export type EnsureExtensionsMenuButtonOptions = {
  containerId: string;
  buttonId: string;
  title: string;
  label: string;
  iconClass: string;
  onClick: () => void | Promise<void>;
  parent$?: JQueryStatic;
  clickNamespace?: string;
};

export type EnsureExtensionsMenuButtonWithRetryOptions = EnsureExtensionsMenuButtonOptions & {
  maxRetries?: number;
  retryDelayMs?: number;
  retryEvents?: EventType[];
  onReady?: () => void;
  onGiveUp?: () => void;
};

export function ensureExtensionsMenuButton({
  containerId,
  buttonId,
  title,
  label,
  iconClass,
  onClick,
  parent$ = $,
  clickNamespace = `.extensionsMenu${buttonId.replace(/[^a-zA-Z0-9]/g, '')}`,
}: EnsureExtensionsMenuButtonOptions): boolean {
  const menu = parent$('#extensionsMenu');
  if (!menu.length) {
    return false;
  }

  let container = parent$(`#${containerId}`);
  if (!container.length) {
    container = parent$(
      `<div id="${containerId}" class="extension_container interactable" tabindex="0">
        <div id="${buttonId}" class="list-group-item flex-container flexGap5 interactable" title="${title}" tabindex="0" role="listitem">
          <div class="${iconClass} extensionsMenuExtensionButton"></div>
          <span>${label}</span>
        </div>
      </div>`,
    );
    menu.append(container);
  }

  parent$(`#${buttonId}`)
    .off(`click${clickNamespace}`)
    .on(`click${clickNamespace}`, event => {
      event.preventDefault();
      event.stopPropagation();
      void onClick();
    });

  return true;
}

export function ensureExtensionsMenuButtonWithRetry({
  maxRetries = 5,
  retryDelayMs = 900,
  retryEvents = [tavern_events.EXTENSIONS_FIRST_LOAD, tavern_events.SETTINGS_UPDATED],
  onReady,
  onGiveUp,
  ...buttonOptions
}: EnsureExtensionsMenuButtonWithRetryOptions) {
  let destroyed = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  const stopList: Array<() => void> = [];

  const clearRetryTimer = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }
  };

  const tryInsert = (attempt = 0): void => {
    if (destroyed) {
      return;
    }

    clearRetryTimer();
    if (ensureExtensionsMenuButton(buttonOptions)) {
      onReady?.();
      return;
    }

    if (attempt < maxRetries) {
      retryTimer = setTimeout(() => tryInsert(attempt + 1), retryDelayMs);
      return;
    }

    onGiveUp?.();
  };

  if (typeof eventMakeLast === 'function' && typeof tavern_events !== 'undefined') {
    retryEvents.forEach(event => {
      stopList.push(
        eventMakeLast(event, () => {
          tryInsert(0);
        }).stop,
      );
    });
  }

  tryInsert();

  return {
    retry: () => {
      tryInsert(0);
    },
    destroy: () => {
      destroyed = true;
      clearRetryTimer();
      stopList.forEach(stop => stop());
      const parent$ = buttonOptions.parent$ ?? $;
      parent$(`#${buttonOptions.containerId}`).remove();
    },
  };
}

export function reloadOnChatChange(): EventOnReturn {
  let chat_id = SillyTavern.getCurrentChatId();
  return eventOn(tavern_events.CHAT_CHANGED, new_chat_id => {
    if (chat_id !== new_chat_id) {
      chat_id = new_chat_id;
      window.location.reload();
    }
  });
}
