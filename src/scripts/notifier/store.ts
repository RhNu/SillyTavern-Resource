import { createLogger } from '@util/core/logger';
import { readVariablesRecord, updateVariablesPath } from '@util/tavern-helper/state/variables';
import { klona } from 'klona';
import _ from 'lodash';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SCRIPT_DISPLAY_NAME, STORE_KEY } from './constants';

const logger = createLogger(SCRIPT_DISPLAY_NAME);

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export const NotifierSettingsSchema = z
  .object({
    keepAliveEnabled: z.boolean().default(false),
    notificationsEnabled: z.boolean().default(false),
    showScriptButton: z.boolean().default(false),
  })
  .prefault({});

export type NotifierSettings = z.infer<typeof NotifierSettingsSchema>;

type NotifierState = {
  settings: NotifierSettings;
  runtimeActive: boolean;
  runtimeStarting: boolean;
  notificationPermission: NotificationPermissionState;
  updateSettings: (recipe: (draft: NotifierSettings) => void) => void;
  setKeepAliveEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setShowScriptButton: (enabled: boolean) => void;
  setRuntimeActive: (active: boolean) => void;
  setRuntimeStarting: (starting: boolean) => void;
  setNotificationPermission: (permission: NotificationPermissionState) => void;
};

const variableOption = {
  type: 'script',
  script_id: getScriptId(),
} as const;

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeStoredSettings(raw: unknown): NotifierSettings {
  if (isObjectLike(raw) && isObjectLike(raw[STORE_KEY])) {
    return NotifierSettingsSchema.parse(raw[STORE_KEY]);
  }

  return NotifierSettingsSchema.parse(raw);
}

function loadStoredSettings(): NotifierSettings {
  const settings = normalizeStoredSettings(readVariablesRecord(variableOption));
  logger.info('已加载 Notifier 设置。', settings);
  return settings;
}

function persistSettings(settings: NotifierSettings) {
  logger.debug('持久化 Notifier 设置。', settings);
  updateVariablesPath(variableOption, STORE_KEY, settings);
}

function produceSettings(current: NotifierSettings, recipe: (draft: NotifierSettings) => void): NotifierSettings {
  const draft = klona(current);
  recipe(draft);
  return NotifierSettingsSchema.parse(draft);
}

export const useNotifierStore = create<NotifierState>()(
  subscribeWithSelector((set, get) => ({
    settings: loadStoredSettings(),
    runtimeActive: false,
    runtimeStarting: false,
    notificationPermission: 'default',

    updateSettings: recipe => {
      const nextSettings = produceSettings(get().settings, recipe);
      if (!_.isEqual(nextSettings, get().settings)) {
        logger.info('Notifier 设置已更新。', nextSettings);
        set({ settings: nextSettings });
      }
    },

    setKeepAliveEnabled: enabled => {
      get().updateSettings(draft => {
        draft.keepAliveEnabled = enabled;
      });
    },

    setNotificationsEnabled: enabled => {
      get().updateSettings(draft => {
        draft.notificationsEnabled = enabled;
      });
    },

    setShowScriptButton: enabled => {
      get().updateSettings(draft => {
        draft.showScriptButton = enabled;
      });
    },

    setRuntimeActive: active => {
      if (get().runtimeActive !== active) {
        logger.debug(`runtimeActive 变更为 ${active}`);
        set({ runtimeActive: active });
      }
    },

    setRuntimeStarting: starting => {
      if (get().runtimeStarting !== starting) {
        logger.debug(`runtimeStarting 变更为 ${starting}`);
        set({ runtimeStarting: starting });
      }
    },

    setNotificationPermission: permission => {
      if (get().notificationPermission !== permission) {
        logger.info(`通知权限状态更新为 ${permission}`);
        set({ notificationPermission: permission });
      }
    },
  })),
);

useNotifierStore.subscribe(
  state => state.settings,
  settings => {
    persistSettings(settings);
  },
  {
    equalityFn: _.isEqual,
    fireImmediately: true,
  },
);
