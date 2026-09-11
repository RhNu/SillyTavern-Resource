export function getSillyTavernLoaderApi(): SillyTavern.ActionLoaderApi {
  if (!SillyTavern?.loader?.show || !SillyTavern.loader.hide) {
    throw new Error('SillyTavern action loader API is unavailable.');
  }
  return SillyTavern.loader;
}
