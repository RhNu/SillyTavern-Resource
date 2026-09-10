import { createScriptSettingsSync, type ScriptSettingsSync } from '@util/script-settings';
import { createLogger } from '../app/logger';
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from './schema';

const SETTINGS_STORE_KEY = 'novelaiImageHelper';
const logger = createLogger('settings/store');

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
    try {
      this.value = this.sync.load();
      logger.info('设置已加载');
    } catch (error) {
      logger.error('加载设置失败', error);
      throw error;
    }
  }

  get(): Settings {
    return structuredClone(this.value);
  }

  update(updater: (draft: Settings) => void, options: { debounced?: boolean } = {}): Settings {
    try {
      const draft = this.get();
      updater(draft);
      this.value = normalizeSettings(draft);
      this.value = options.debounced ? this.sync.schedule(this.value) : this.sync.save(this.value);
      this.listeners.forEach(listener => {
        try {
          listener(this.get());
        } catch (error) {
          logger.error('设置变更监听器执行失败', error);
        }
      });
      logger.debug('设置已更新', { debounced: options.debounced ?? false });
      return this.get();
    } catch (error) {
      logger.error('更新设置失败', error, { debounced: options.debounced ?? false });
      throw error;
    }
  }

  replace(settings: Settings, options: { debounced?: boolean } = {}): Settings {
    return this.update(draft => Object.assign(draft, settings), options);
  }

  flush(): void {
    try {
      this.sync.flush();
      logger.debug('设置已刷新写入');
    } catch (error) {
      logger.error('刷新设置失败', error);
      throw error;
    }
  }

  destroy(): void {
    try {
      this.sync.destroy();
    } catch (error) {
      logger.error('销毁设置同步器失败', error);
      throw error;
    } finally {
      this.listeners.clear();
      logger.debug('设置存储已销毁');
    }
  }

  subscribe(listener: (settings: Settings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
