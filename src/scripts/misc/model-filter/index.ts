import { createLogger } from '@util/core/logger';
import { mountReactExtensionSettings } from '@util/ui/extension-settings/react';
import { createElement } from 'react';
import SettingsPanel from './SettingsPanel';
import { createModelFilterRuntime } from './runtime';
import './style.css';

const logger = createLogger('模型列表过滤');
let activeDestroy: (() => void) | null = null;

function initialize(): void {
  activeDestroy?.();
  const runtime = createModelFilterRuntime();
  let panel: ReturnType<typeof mountReactExtensionSettings>;
  try {
    panel = mountReactExtensionSettings(createElement(SettingsPanel, { runtime }));
  } catch (error) {
    runtime.destroy();
    logger.error('挂载设置界面失败。', error);
    throw error;
  }
  const destroy = () => {
    $(window).off('pagehide.modelFilter');
    panel.destroy();
    runtime.destroy();
    if (activeDestroy === destroy) activeDestroy = null;
  };
  activeDestroy = destroy;
  $(window).on('pagehide.modelFilter', destroy);
  logger.info('模型列表过滤脚本已就绪。');
}

$(() => errorCatched(initialize)());
