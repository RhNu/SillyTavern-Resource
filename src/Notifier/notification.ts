import { createLogger } from '@util/common';
import { getHostWindow } from '@util/host';
import { NOTIFICATION_ICON_URL, SCRIPT_DISPLAY_NAME } from './constants';
import type { NotificationPermissionState } from './store';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

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
    logger.warn('通知权限请求失败：当前环境不支持 Notification API。');
    return 'unsupported';
  }

  logger.info('开始请求通知权限。');
  const permission = await notificationApi.requestPermission();
  logger.info(`通知权限请求结果：${permission}`);
  return permission;
}

export function sendSystemNotification(title: string, body: string): Notification | null {
  const notificationApi = resolveNotificationApi();
  if (!notificationApi) {
    logger.warn('发送通知失败：当前环境不支持 Notification API。');
    return null;
  }

  if (notificationApi.permission !== 'granted') {
    logger.debug(`发送通知已跳过：权限状态为 ${notificationApi.permission}。`);
    return null;
  }

  const notification = new notificationApi(title, {
    body,
    icon: NOTIFICATION_ICON_URL,
  });

  logger.info(`系统通知实例已创建：${title}`);
  return notification;
}
