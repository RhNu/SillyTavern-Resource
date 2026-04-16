import { createElement } from 'react';
import { mountExtensionSetting } from '@util/ui';
import './index.scss';
import SettingsPanel from './SettingsPanel';
import { createNotifierRuntime } from './runtime';

let activeDestroy: (() => void) | null = null;

function initialize() {
  activeDestroy?.();

  const runtime = createNotifierRuntime();
  const panel = mountExtensionSetting(createElement(SettingsPanel, { runtime }));

  const destroy = () => {
    $(window).off('pagehide.notifier');
    panel.destroy();
    runtime.destroy();

    if (activeDestroy === destroy) {
      activeDestroy = null;
    }
  };

  activeDestroy = destroy;

  $(window)
    .off('pagehide.notifier')
    .on('pagehide.notifier', () => {
      destroy();
    });
}

$(() => {
  errorCatched(initialize)();
});
