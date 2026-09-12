import { createLogger } from '@util/core/logger';
import { SCRIPT_DISPLAY_NAME } from './constants';
import { initializeStyleTunerLauncher } from './launcher';
import { notify } from './notify';
import { loadStyleTunerSettings } from './settings';
import { applyStyleTuners, removeAllStyleTuners } from './styles';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

let activeDestroy: (() => void) | null = null;

function initialize(): void {
  activeDestroy?.();

  logger.info('初始化样式微调器。');

  // 启动时按已保存的开关表应用一次样式注入
  applyStyleTuners(loadStyleTunerSettings());

  const launcher = initializeStyleTunerLauncher();

  notify('success', '已就绪，可在魔法棒菜单中调整样式。');

  const destroy = () => {
    launcher.destroy();
    removeAllStyleTuners();
    if (activeDestroy === destroy) {
      activeDestroy = null;
    }
  };

  activeDestroy = destroy;

  $(window)
    .off('pagehide.styletuner')
    .on('pagehide.styletuner', () => {
      logger.info('清理样式微调器。');
      notify('info', '已卸载，注入的样式已清理。');
      destroy();
    });
}

$(() => {
  errorCatched(initialize)();
});
