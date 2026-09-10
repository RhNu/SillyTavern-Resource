import { createScriptSettingsSync, type ScriptSettingsSync } from '@util/script-settings';
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from './schema';

const SETTINGS_STORE_KEY = 'novelaiImageHelper';

function createSettingsSync(): ScriptSettingsSync<Settings> {
  return createScriptSettingsSync({
    key: SETTINGS_STORE_KEY,
    legacyPaths: [`${SETTINGS_STORE_KEY}.settings`],
    parse: value => normalizeSettings(value),
    defaultValue: () => structuredClone(DEFAULT_SETTINGS),
    debounceMs: 500,
  });
}

export class SettingsStore {
  private value: Settings;
  private readonly listeners = new Set<(settings: Settings) => void>();

  constructor(private readonly sync: ScriptSettingsSync<Settings> = createSettingsSync()) {
    this.value = this.sync.load();
  }

  get(): Settings {
    return structuredClone(this.value);
  }

  update(updater: (draft: Settings) => void, options: { debounced?: boolean } = {}): Settings {
    const draft = this.get();
    updater(draft);
    this.value = normalizeSettings(draft);
    this.value = options.debounced ? this.sync.schedule(this.value) : this.sync.save(this.value);
    this.listeners.forEach(listener => listener(this.get()));
    return this.get();
  }

  replace(settings: Settings, options: { debounced?: boolean } = {}): Settings {
    return this.update(draft => Object.assign(draft, settings), options);
  }

  flush(): void {
    this.sync.flush();
  }

  destroy(): void {
    this.sync.destroy();
    this.listeners.clear();
  }

  subscribe(listener: (settings: Settings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
