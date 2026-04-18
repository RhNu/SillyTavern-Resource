import { readVariablesRecord, updateVariablesPath } from '@util/variables';
import { klona } from 'klona';
import _ from 'lodash';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { STORE_KEY } from './constants';

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
  return normalizeStoredSettings(readVariablesRecord(variableOption));
}

function persistSettings(settings: NotifierSettings) {
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
        set({ runtimeActive: active });
      }
    },

    setRuntimeStarting: starting => {
      if (get().runtimeStarting !== starting) {
        set({ runtimeStarting: starting });
      }
    },

    setNotificationPermission: permission => {
      if (get().notificationPermission !== permission) {
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
