import { displayPopup } from './shortcuts';

export type HelpMarkerProps = {
  text: string;
  title?: string;
  className?: string;
};

export function openHelpPopup(title: string, text: string) {
  try {
    const session = displayPopup({
      title,
      content: text,
      popup: {
        wider: true,
        leftAlign: true,
        allowVerticalScrolling: true,
      },
    });
    void session.closed.catch(error => {
      console.error(`[HelpMarker] Popup failed: ${title}`, error);
    });
  } catch (error) {
    toastr.info(text, title, {
      timeOut: 8000,
      extendedTimeOut: 1500,
    });
    console.warn(`[HelpMarker] Popup API unavailable: ${title}`, error);
  }
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
