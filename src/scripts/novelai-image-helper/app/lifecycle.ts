import { getHostWindow } from '@util/st/dom/host';

const LIFECYCLE_KEY = '__novelAiImageHelperActiveDestroy';
type HostWithLifecycle = Window & { [LIFECYCLE_KEY]?: () => void };

function host(): HostWithLifecycle {
  return getHostWindow() as HostWithLifecycle;
}

/** 跨脚本 iframe / cache-buster 重载清理上一实例，避免遗留 DOM、监听器和任务。 */
export function destroyPreviousInstance(): void {
  const previous = host()[LIFECYCLE_KEY];
  if (!previous) return;
  previous();
}

export function registerActiveInstance(destroy: () => void): void {
  host()[LIFECYCLE_KEY] = destroy;
}

export function unregisterActiveInstance(destroy: () => void): void {
  const target = host();
  if (target[LIFECYCLE_KEY] === destroy) delete target[LIFECYCLE_KEY];
}
