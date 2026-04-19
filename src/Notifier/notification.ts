import { getHostWindow } from '@util/host';
import { NOTIFICATION_ICON_URL } from './constants';
import type { NotificationPermissionState } from './store';

function resolveNotificationApi(): typeof Notification | null {
  return (getHostWindow() as Window & typeof globalThis).Notification ?? window.Notification ?? null;
}

export function getNotificationPermissionState(): NotificationPermissionState {
  const notificationApi = resolveNotificationApi();
  return notificationApi ? notificationApi.permission : 'unsupported';
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const notificationApi = resolveNotificationApi();
  if (!notificationApi) {
    return 'unsupported';
  }

  return notificationApi.requestPermission();
}

export function sendSystemNotification(title: string, body: string): Notification | null {
  const notificationApi = resolveNotificationApi();
  if (!notificationApi || notificationApi.permission !== 'granted') {
    return null;
  }

  return new notificationApi(title, {
    body,
    icon: NOTIFICATION_ICON_URL,
  });
}
