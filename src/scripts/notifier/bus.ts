import { createLogger } from '@util/core/logger';
import { getHostWindow } from '@util/st/dom/host';
import { SCRIPT_DISPLAY_NAME } from './constants';
import { sendSystemNotification } from './notification';
import { useNotifierStore } from './store';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

export type NotifierNotificationInput = {
  title: string;
  body: string;
  onlyWhenHostWindowBlurred?: boolean;
  focusHostWindowOnClick?: boolean;
  onClick?: (notification: Notification, event: Event) => void;
};

export type NotifierSourceDefaults = Partial<NotifierNotificationInput>;

export type NotifierSourceHandle = {
  source: string;
  notify: (input: Partial<NotifierNotificationInput>) => Notification | null;
  unregister: () => void;
};

export type NotifierBus = {
  notify: (input: NotifierNotificationInput) => Notification | null;
  registerSource: (source: string, defaults?: NotifierSourceDefaults) => NotifierSourceHandle;
};

function isHostWindowFocused() {
  const hostDocument = getHostWindow().document ?? document;
  if (typeof hostDocument.hasFocus === 'function') {
    return hostDocument.hasFocus();
  }

  return hostDocument.visibilityState === 'visible';
}

function normalizeNotificationInput(
  input: Partial<NotifierNotificationInput>,
  defaults?: NotifierSourceDefaults,
): NotifierNotificationInput | undefined {
  const title = input.title ?? defaults?.title;
  const body = input.body ?? defaults?.body;
  if (!title || !body) {
    return undefined;
  }

  return {
    title,
    body,
    onlyWhenHostWindowBlurred: input.onlyWhenHostWindowBlurred ?? defaults?.onlyWhenHostWindowBlurred ?? true,
    focusHostWindowOnClick: input.focusHostWindowOnClick ?? defaults?.focusHostWindowOnClick ?? true,
    onClick: input.onClick ?? defaults?.onClick,
  };
}

export function createNotifierBus(): NotifierBus {
  const sourceTokens = new Map<symbol, string>();

  const notify = (input: NotifierNotificationInput): Notification | null => {
    const state = useNotifierStore.getState();
    if (!state.settings.notificationsEnabled) {
      logger.debug('通知已跳过：通知总开关关闭。');
      return null;
    }

    if (state.notificationPermission !== 'granted') {
      logger.debug(`通知已跳过：权限状态为 ${state.notificationPermission}。`);
      return null;
    }

    if (input.onlyWhenHostWindowBlurred && isHostWindowFocused()) {
      logger.debug('通知已跳过：宿主窗口仍在前台。');
      return null;
    }

    const notification = sendSystemNotification(input.title, input.body);
    if (!notification) {
      logger.warn('通知发送失败：系统通知实例创建失败。');
      return null;
    }

    logger.info(`通知已发送：${input.title}`);

    notification.onclick = event => {
      event.preventDefault();
      logger.info(`通知被点击：${input.title}`);
      if (input.focusHostWindowOnClick) {
        getHostWindow().focus();
      }
      input.onClick?.(notification, event);
      notification.close();
    };

    return notification;
  };

  const registerSource = (source: string, defaults: NotifierSourceDefaults = {}): NotifierSourceHandle => {
    const token = Symbol(source);
    sourceTokens.set(token, source);
    logger.info(`通知源已注册：${source}`);

    return {
      source,
      notify: input => {
        if (!sourceTokens.has(token)) {
          logger.debug(`通知已跳过：来源 ${source} 已注销。`);
          return null;
        }

        const normalized = normalizeNotificationInput(input, defaults);
        if (!normalized) {
          logger.warn(`通知已跳过：来源 ${source} 的输入缺少标题或正文。`);
          return null;
        }

        return notify(normalized);
      },
      unregister: () => {
        if (sourceTokens.delete(token)) {
          logger.info(`通知源已注销：${source}`);
        }
      },
    };
  };

  return {
    notify,
    registerSource,
  };
}

export const notifierBus = createNotifierBus();
