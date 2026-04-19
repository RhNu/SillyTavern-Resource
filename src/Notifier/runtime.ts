import { getHostWindow } from '@util/host';
import _ from 'lodash';
import { bindScriptButtonEvents, createKeepAliveController, syncScriptButtons } from './keepalive';
import { getNotificationPermissionState, requestNotificationPermission, sendSystemNotification } from './notification';
import { useNotifierStore } from './store';

export type NotifierRuntime = ReturnType<typeof createNotifierRuntime>;

function sendGenerationFinishedNotification() {
  const state = useNotifierStore.getState();
  if (!state.settings.notificationsEnabled || state.notificationPermission !== 'granted') {
    return;
  }

  const characterName = getCurrentCharacterName()?.trim() || '对方';
  const notification = sendSystemNotification(`${characterName} 有新回复`, '生成已经完成，可以回到对话继续阅读了。');
  if (!notification) {
    return;
  }

  notification.onclick = event => {
    event.preventDefault();
    getHostWindow().focus();
    notification.close();
  };
}

export function createNotifierRuntime() {
  const setKeepAliveEnabled = useNotifierStore.getState().setKeepAliveEnabled;
  const keepAlive = createKeepAliveController({
    onActiveChange: active => {
      useNotifierStore.getState().setRuntimeActive(active);
    },
    onStartingChange: starting => {
      useNotifierStore.getState().setRuntimeStarting(starting);
    },
  });

  useNotifierStore.getState().setNotificationPermission(getNotificationPermissionState());

  const syncKeepAliveEnabled = (enabled: boolean) => {
    if (useNotifierStore.getState().settings.keepAliveEnabled !== enabled) {
      setKeepAliveEnabled(enabled);
    }
  };

  const finalizeKeepAliveAttempt = (active: boolean) => {
    if (active) {
      syncKeepAliveEnabled(true);
      return true;
    }

    keepAlive.stop();
    syncKeepAliveEnabled(false);
    return false;
  };

  const restoreKeepAlive = async () => {
    if (!useNotifierStore.getState().settings.keepAliveEnabled) {
      keepAlive.probePlayback();
      return false;
    }

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
      void runtime.startKeepAlive();
    },
    () => {
      runtime.stopKeepAlive();
    },
  );

  const generationListener = eventOn(tavern_events.GENERATION_ENDED, sendGenerationFinishedNotification);
  const refreshPermission = () => {
    useNotifierStore.getState().setNotificationPermission(getNotificationPermissionState());
  };

  window.addEventListener('focus', refreshPermission);
  document.addEventListener('visibilitychange', refreshPermission);

  const runtime = {
    async startKeepAlive() {
      syncKeepAliveEnabled(true);
      const started = await keepAlive.start({ userInitiated: true });
      return finalizeKeepAliveAttempt(keepAlive.probePlayback() || started);
    },

    stopKeepAlive() {
      keepAlive.stop();
      syncKeepAliveEnabled(false);
    },

    async requestPermission() {
      const permission = await requestNotificationPermission();
      useNotifierStore.getState().setNotificationPermission(permission);

      if (permission === 'unsupported') {
        toastr.warning('当前环境不支持系统通知');
        return permission;
      }

      if (permission === 'granted') {
        sendSystemNotification('通知已开启', '生成结束后会自动提醒你。');
        toastr.success('通知权限已开启');
        return permission;
      }

      if (permission === 'denied') {
        toastr.warning('通知权限已被拒绝，请到系统或浏览器设置中手动开启');
        return permission;
      }

      toastr.info('通知权限仍未授权');
      return permission;
    },

    destroy() {
      keepAlive.destroy();
      scriptButtonSyncStop();
      scriptButtons.destroy();
      generationListener.stop();
      window.removeEventListener('focus', refreshPermission);
      document.removeEventListener('visibilitychange', refreshPermission);
    },
  };

  void restoreKeepAlive();

  return runtime;
}
