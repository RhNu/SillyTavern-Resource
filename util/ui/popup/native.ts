import type { SillyTavernPopupApi } from './native-types';

type SillyTavernWithPopupApi = typeof SillyTavern & SillyTavernPopupApi;

export function getSillyTavernPopupApi(): SillyTavernPopupApi {
  const api = SillyTavern as SillyTavernWithPopupApi;
  if (!api?.Popup || !api.POPUP_RESULT || !api.POPUP_TYPE) {
    throw new Error('SillyTavern Popup API is unavailable.');
  }
  return api;
}
