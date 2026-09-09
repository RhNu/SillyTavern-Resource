let activeDestroy: ((options?: { notify?: boolean }) => void) | undefined;

export function replaceActiveDestroy(nextDestroy: (options?: { notify?: boolean }) => void) {
  activeDestroy?.();
  activeDestroy = nextDestroy;
}

export function clearActiveDestroy(destroy: (options?: { notify?: boolean }) => void) {
  if (activeDestroy === destroy) {
    activeDestroy = undefined;
  }
}
