import _ from 'lodash';
import { bindQrButtonEvents, createKeepAliveController, syncQrButtons } from './keepalive';
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  sendSystemNotification,
} from './notification';
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
    window.parent.focus();
    notification.close();
  };
}

export function createNotifierRuntime() {
  const setKeepAliveEnabled = useNotifierStore.getState().setKeepAliveEnabled;
  const keepAlive = createKeepAliveController({
    getMode: () => useNotifierStore.getState().settings.keepAliveMode,
    onActiveChange: active => {
      useNotifierStore.getState().setRuntimeActive(active);
    },
    onStopRequest: () => {
      setKeepAliveEnabled(false);
    },
  });

  useNotifierStore.getState().setNotificationPermission(getNotificationPermissionState());

  const keepAliveStop = useNotifierStore.subscribe(
    state => ({
      enabled: state.settings.keepAliveEnabled,
      mode: state.settings.keepAliveMode,
    }),
    (current, previous) => {
      if (!current.enabled) {
        keepAlive.stop();
        return;
      }

      if (!previous?.enabled) {
        keepAlive.start();
        return;
      }

      if (previous.mode !== current.mode) {
        keepAlive.restartMode();
      }
    },
    {
      equalityFn: _.isEqual,
      fireImmediately: true,
    },
  );

  const qrSyncStop = useNotifierStore.subscribe(
    state => ({
      showQrButton: state.settings.showQrButton,
      runtimeActive: state.runtimeActive,
    }),
    current => {
      syncQrButtons(current.showQrButton, current.runtimeActive);
    },
    {
      equalityFn: _.isEqual,
      fireImmediately: true,
    },
  );

  const qrButtons = bindQrButtonEvents(
    () => useNotifierStore.getState().setKeepAliveEnabled(true),
    () => useNotifierStore.getState().setKeepAliveEnabled(false),
  );

  const generationListener = eventOn(tavern_events.GENERATION_ENDED, sendGenerationFinishedNotification);
  const refreshPermission = () => {
    useNotifierStore.getState().setNotificationPermission(getNotificationPermissionState());
  };

  window.addEventListener('focus', refreshPermission);
  document.addEventListener('visibilitychange', refreshPermission);

  return {
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
      keepAliveStop();
      qrSyncStop();
      qrButtons.destroy();
      generationListener.stop();
      window.removeEventListener('focus', refreshPermission);
      document.removeEventListener('visibilitychange', refreshPermission);
    },
  };
}
