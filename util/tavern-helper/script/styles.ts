export type TeleportedStyleSession = { destroy(): void };

export function teleportStyle(
  appendTo: JQuery.Selector | JQuery.htmlString | JQuery.TypeOrArray<Element | DocumentFragment> | JQuery = 'head',
): TeleportedStyleSession {
  const $container = $('<div>')
    .attr('script_id', getScriptId())
    .append($('head > style', document).clone())
    .appendTo(appendTo);

  let destroyed = false;
  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      $container.remove();
    },
  };
}
