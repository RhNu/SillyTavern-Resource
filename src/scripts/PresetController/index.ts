import { createPresetControllerRuntime } from './runtime';

let activeDestroy: (() => void) | null = null;

function initialize() {
  activeDestroy?.();

  const runtime = createPresetControllerRuntime();
  const destroy = () => {
    runtime.destroy();
    if (activeDestroy === destroy) {
      activeDestroy = null;
    }
  };

  activeDestroy = destroy;
}

$(() => {
  errorCatched(initialize)();
});
