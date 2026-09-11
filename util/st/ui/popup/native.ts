export type SillyTavernPopupApi = Pick<typeof SillyTavern, 'Popup' | 'POPUP_RESULT' | 'POPUP_TYPE'>;

export function getSillyTavernPopupApi(): SillyTavernPopupApi {
  if (!SillyTavern?.Popup || !SillyTavern.POPUP_RESULT || !SillyTavern.POPUP_TYPE) {
    throw new Error('SillyTavern Popup API is unavailable.');
  }
  return SillyTavern;
}
