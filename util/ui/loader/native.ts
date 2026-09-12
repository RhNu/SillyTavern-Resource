import { getHostJQuery } from '../../st/dom/host';
import type { NativeLoaderApi } from './native-types';
import type { LoaderUpdate } from './types';

type SillyTavernWithLoaderApi = typeof SillyTavern & { readonly loader: NativeLoaderApi };

export function getSillyTavernLoaderApi(): NativeLoaderApi {
  const api = SillyTavern as SillyTavernWithLoaderApi;
  if (!api?.loader?.show || !api.loader.hide) {
    throw new Error('SillyTavern action loader API is unavailable.');
  }
  return api.loader;
}

/** 酒馆 1.18.0 没有文字更新接口；将对原生 toast DOM 的依赖集中在此适配层。 */
export function updateSillyTavernLoaderToast(id: string, options: LoaderUpdate): void {
  const $ = getHostJQuery();
  const toast = $('.action-loader-toast').filter((_index, element) => element.dataset.loaderId === id);
  toast.find('.action-loader-message').text(options.message);
  if (options.stopTooltip !== undefined) toast.find('.action-loader-stop').attr('title', options.stopTooltip);
}
