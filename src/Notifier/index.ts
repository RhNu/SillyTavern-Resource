import { createLogger } from '@util/common';
import { mountExtensionSetting } from '@util/ui';
import { createElement } from 'react';
import { SCRIPT_DISPLAY_NAME } from './constants';
import './index.scss';
import { createNotifierRuntime } from './runtime';
import SettingsPanel from './SettingsPanel';

let activeDestroy: (() => void) | null = null;
const logger = createLogger(SCRIPT_DISPLAY_NAME);

function initialize() {
  logger.info('Initializing.');
  if (activeDestroy) {
    logger.info('Existing instance found. Cleaning up before re-initialization.');
  }
  activeDestroy?.();

  const runtime = createNotifierRuntime();
  const panel = mountExtensionSetting(createElement(SettingsPanel, { runtime }));
  logger.info('Settings panel mounted.');

  const destroy = () => {
    logger.info('Destroying runtime and panel.');
    $(window).off('pagehide.notifier');
    panel.destroy();
    runtime.destroy();

    if (activeDestroy === destroy) {
      activeDestroy = null;
    }
  };

  activeDestroy = destroy;

  $(window).off('pagehide.notifier').on('pagehide.notifier', destroy);
  logger.info('Lifecycle handlers attached.');
}

$(() => {
  logger.info('Document ready, bootstrapping.');
  errorCatched(initialize)();
});
