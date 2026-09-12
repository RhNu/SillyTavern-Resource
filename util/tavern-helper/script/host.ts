import iframeSrcdoc from './iframe_srcdoc.html?raw';

export function createScriptIdIframe(): JQuery<HTMLIFrameElement> {
  return $('<iframe>').attr({
    script_id: getScriptId(),
    frameborder: 0,
    srcdoc: iframeSrcdoc,
  }) as JQuery<HTMLIFrameElement>;
}

export function createScriptIdDiv(): JQuery<HTMLDivElement> {
  return $('<div>').attr('script_id', getScriptId()) as JQuery<HTMLDivElement>;
}
