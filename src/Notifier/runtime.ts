import { createLogger } from '@util/common';
import _ from 'lodash';
import { notifierBus } from './bus';
import { NOTIFIER_BUS_GLOBAL_KEY, SCRIPT_DISPLAY_NAME } from './constants';
import { bindScriptButtonEvents, createKeepAliveController, syncScriptButtons } from './keepalive';
import { getNotificationPermissionState, requestNotificationPermission, sendSystemNotification } from './notification';
import { useNotifierStore } from './store';

export type NotifierRuntime = ReturnType<typeof createNotifierRuntime>;
const logger = createLogger(SCRIPT_DISPLAY_NAME);

export function createNotifierRuntime() {
  logger.info('Creating runtime.');
  const setKeepAliveEnabled = useNotifierStore.getState().setKeepAliveEnabled;
  const keepAlive = createKeepAliveController({
    onActiveChange: active => {
      logger.info(`Keep-alive active state changed: ${active ? 'active' : 'inactive'}.`);
      useNotifierStore.getState().setRuntimeActive(active);
    },
    onStartingChange: starting => {
      logger.info(`Keep-alive starting state changed: ${starting ? 'starting' : 'idle'}.`);
      useNotifierStore.getState().setRuntimeStarting(starting);
    },
  });

  initializeGlobal(NOTIFIER_BUS_GLOBAL_KEY, notifierBus);

  useNotifierStore.getState().setNotificationPermission(getNotificationPermissionState());

  const syncKeepAliveEnabled = (enabled: boolean) => {
    if (useNotifierStore.getState().settings.keepAliveEnabled !== enabled) {
      setKeepAliveEnabled(enabled);
    }
  };

  const finalizeKeepAliveAttempt = (active: boolean) => {
    if (active) {
      logger.info('Keep-alive attempt succeeded.');
      syncKeepAliveEnabled(true);
      return true;
    }

    logger.warn('Keep-alive attempt failed, rolling back to disabled state.');
    keepAlive.stop();
    syncKeepAliveEnabled(false);
    return false;
  };

  const restoreKeepAlive = async () => {
    if (!useNotifierStore.getState().settings.keepAliveEnabled) {
      logger.info('Keep-alive is disabled in settings, only probing playback.');
      keepAlive.probePlayback();
      return false;
    }

    logger.info('Restoring keep-alive from persisted settings.');
    const started = await keepAlive.start();
    return finalizeKeepAliveAttempt(keepAlive.probePlayback() || started);
  };

  const scriptButtonSyncStop = useNotifierStore.subscribe(
    state => ({
      showScriptButton: state.settings.showScriptButton,
      keepAliveEnabled: state.settings.keepAliveEnabled,
    }),
    current => {
      syncScriptButtons(current.showScriptButton, current.keepAliveEnabled);
    },
    {
      equalityFn: _.isEqual,
      fireImmediately: true,
    },
  );

  const scriptButtons = bindScriptButtonEvents(
    () => {
      logger.info('Start keep-alive requested from script button.');
      void runtime.startKeepAlive();
    },
    () => {
      logger.info('Stop keep-alive requested from script button.');
      runtime.stopKeepAlive();
    },
  );

  const tavernGenerationSource = notifierBus.registerSource('tavern-generation');
  const generationListener = eventOn(tavern_events.GENERATION_ENDED, () => {
    const characterName = getCurrentCharacterName()?.trim() || '对方';
    tavernGenerationSource.notify({
      title: `${characterName} 有新回复`,
      body: '生成已经完成，可以回到对话继续阅读了。',
    });
  });
  const refreshPermission = () => {
    useNotifierStore.getState().setNotificationPermission(getNotificationPermissionState());
  };

  window.addEventListener('focus', refreshPermission);
  document.addEventListener('visibilitychange', refreshPermission);

  const runtime = {
    async startKeepAlive() {
      logger.info('Start keep-alive requested.');
      syncKeepAliveEnabled(true);
      const started = await keepAlive.start({ userInitiated: true });
      return finalizeKeepAliveAttempt(keepAlive.probePlayback() || started);
    },

    stopKeepAlive() {
      logger.info('Stop keep-alive requested.');
      keepAlive.stop();
      syncKeepAliveEnabled(false);
    },

    async requestPermission() {
      logger.info('Notification permission request started.');
      const permission = await requestNotificationPermission();
      useNotifierStore.getState().setNotificationPermission(permission);

      if (permission === 'unsupported') {
        logger.warn('Notification API is unsupported in current environment.');
        toastr.warning('当前环境不支持系统通知');
        return permission;
      }

      if (permission === 'granted') {
        logger.info('Notification permission granted.');
        sendSystemNotification('通知已开启', '生成结束后会自动提醒你。');
        toastr.success('通知权限已开启');
        return permission;
      }

      if (permission === 'denied') {
        logger.warn('Notification permission denied.');
        toastr.warning('通知权限已被拒绝，请到系统或浏览器设置中手动开启');
        return permission;
      }

      logger.info('Notification permission remains in default state.');
      toastr.info('通知权限仍未授权');
      return permission;
    },

    destroy() {
      logger.info('Destroying runtime resources.');
      keepAlive.destroy();
      scriptButtonSyncStop();
      scriptButtons.destroy();
      tavernGenerationSource.unregister();
      generationListener.stop();
      window.removeEventListener('focus', refreshPermission);
      document.removeEventListener('visibilitychange', refreshPermission);
      logger.info('Runtime destroyed.');
    },
  };

  logger.info('Scheduling keep-alive restore.');
  void restoreKeepAlive();

  logger.info('Runtime created.');
  return runtime;
}
