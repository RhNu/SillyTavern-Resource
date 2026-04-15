import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const Settings = z
  .object({
    button_selected: z.boolean().default(false),
  })
  .prefault({});

type SettingsData = z.infer<typeof Settings>;
type SettingsState = {
  settings: SettingsData;
  setSettings: (value: SettingsData | ((old_settings: SettingsData) => SettingsData)) => void;
};

const variableOption = { type: 'script', script_id: getScriptId() } as const;

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    settings: Settings.parse(getVariables(variableOption)),
    setSettings: value => {
      const current = get().settings;
      const nextSettings = typeof value === 'function' ? value(current) : value;
      const parsed = Settings.safeParse(nextSettings);
      if (parsed.error) {
        return;
      }
      set({ settings: parsed.data });
    },
  })),
);

useSettingsStore.subscribe(
  state => state.settings,
  settings => {
    insertOrAssignVariables(_.cloneDeep(settings), variableOption);
  },
  { equalityFn: _.isEqual },
);
