export type PopupGateway = ReturnType<typeof createPopupGateway>;

export function createPopupGateway() {
  return {
    hasGenericPopup() {
      return typeof SillyTavern?.callGenericPopup === 'function' && typeof SillyTavern?.POPUP_TYPE !== 'undefined';
    },
    openGenericDisplayPopup(host: JQuery<HTMLElement>, title: string, options?: Record<string, unknown>) {
      return SillyTavern.callGenericPopup(host, SillyTavern.POPUP_TYPE.DISPLAY, title, options);
    },
    hasPopupClass() {
      return typeof SillyTavern?.Popup === 'function' && typeof SillyTavern?.POPUP_TYPE !== 'undefined';
    },
    createDisplayPopup(host: HTMLElement, options?: Record<string, unknown>) {
      return new SillyTavern.Popup(host, SillyTavern.POPUP_TYPE.DISPLAY, '', options);
    },
  };
}
