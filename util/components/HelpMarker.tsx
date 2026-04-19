type HelpMarkerProps = {
  text: string;
  title?: string;
  className?: string;
};

export function openHelpPopup(title: string, text: string) {
  if (typeof SillyTavern?.callGenericPopup === 'function' && typeof SillyTavern?.POPUP_TYPE !== 'undefined') {
    const $content = $('<div>')
      .css({
        whiteSpace: 'pre-wrap',
        lineHeight: '1.4',
        fontSize: '0.95rem',
        padding: '0.5rem',
      })
      .text(text);

    void SillyTavern.callGenericPopup($content, SillyTavern.POPUP_TYPE.DISPLAY, title, {
      wider: true,
      leftAlign: true,
      allowVerticalScrolling: true,
    });
    return;
  }

  toastr.info(text, title, {
    timeOut: 8000,
    extendedTimeOut: 1500,
  });
  console.warn(`[HelpMarker] Popup API unavailable: ${title}`);
}

export function HelpMarker({ text, title = '说明', className }: HelpMarkerProps) {
  return (
    <button
      aria-label={title}
      className={['th-help-marker', className].filter(Boolean).join(' ')}
      title={title}
      type="button"
      onClick={() => {
        openHelpPopup(title, text);
      }}
    >
      <i className="fa-solid fa-circle-question"></i>
    </button>
  );
}
