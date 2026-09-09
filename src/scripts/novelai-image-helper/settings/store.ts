import { readVariablesPath, updateVariablesPath } from '@util/variables';
import { normalizeSettings, type Settings } from './schema';

const SETTINGS_PATH = 'novelaiImageHelper.settings';

export class SettingsStore {
  private value: Settings;
  private readonly listeners = new Set<(settings: Settings) => void>();

  constructor() {
    this.value = normalizeSettings(readVariablesPath({ type: 'script', script_id: getScriptId() }, SETTINGS_PATH));
  }

  get(): Settings {
    return structuredClone(this.value);
  }

  update(updater: (draft: Settings) => void): Settings {
    const draft = this.get();
    updater(draft);
    this.value = normalizeSettings(draft);
    updateVariablesPath({ type: 'script', script_id: getScriptId() }, SETTINGS_PATH, this.value);
    this.listeners.forEach(listener => listener(this.get()));
    return this.get();
  }

  subscribe(listener: (settings: Settings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
