import { getHostWindow } from '@util/host';
import { sendSystemNotification } from './notification';
import { useNotifierStore } from './store';

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
    if (!state.settings.notificationsEnabled || state.notificationPermission !== 'granted') {
      return null;
    }

    if (input.onlyWhenHostWindowBlurred && isHostWindowFocused()) {
      return null;
    }

    const notification = sendSystemNotification(input.title, input.body);
    if (!notification) {
      return null;
    }

    notification.onclick = event => {
      event.preventDefault();
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

    return {
      source,
      notify: input => {
        if (!sourceTokens.has(token)) {
          return null;
        }

        const normalized = normalizeNotificationInput(input, defaults);
        return normalized ? notify(normalized) : null;
      },
      unregister: () => {
        sourceTokens.delete(token);
      },
    };
  };

  return {
    notify,
    registerSource,
  };
}

export const notifierBus = createNotifierBus();
