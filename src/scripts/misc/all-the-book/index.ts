import { createLogger } from '@util/core/logger';

import { PAGEHIDE_NAMESPACE, SCRIPT_DISPLAY_NAME } from './constants';
import { createAllTheBookRuntime } from './runtime';

const logger = createLogger(SCRIPT_DISPLAY_NAME);
let activeDestroy: (() => void) | null = null;

function initialize() {
  logger.info('Initializing runtime.');
  activeDestroy?.();

  const runtime = createAllTheBookRuntime(logger);
  const destroy = () => {
    $(window).off(PAGEHIDE_NAMESPACE);
    runtime.destroy();
    logger.info('Runtime destroyed.');

    if (activeDestroy === destroy) {
      activeDestroy = null;
    }
  };

  activeDestroy = destroy;
  $(window).off(PAGEHIDE_NAMESPACE).on(PAGEHIDE_NAMESPACE, destroy);
}

$(() => {
  errorCatched(initialize)();
});
