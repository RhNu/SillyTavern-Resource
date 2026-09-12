import { klona } from 'klona';
import _ from 'lodash';
import { readVariablesRecord, updateVariablesPath } from './variables';

export type ScriptSettingsSync<T> = {
  load: () => T;
  save: (settings: T) => T;
  schedule: (settings: T) => T;
  flush: () => void;
  destroy: () => void;
};

export type ScriptSettingsSyncOptions<T> = {
  /** Root path used in the script variable record. */
  key: string;
  /** Validate and normalize both loaded and saved values. Throw when the value is invalid. */
  parse: (value: unknown) => T;
  defaultValue: T | (() => T);
  debounceMs?: number;
  legacyPaths?: string[];
  scriptId?: string;
};

function resolveDefault<T>(value: T | (() => T)): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * Synchronize validated settings with one script-variable path.
 *
 * The script id is captured once, normalized settings are written back on load,
 * and scheduled writes are flushed when the synchronizer is destroyed.
 */
export function createScriptSettingsSync<T>(options: ScriptSettingsSyncOptions<T>): ScriptSettingsSync<T> {
  const variableOption = {
    type: 'script',
    script_id: options.scriptId ?? getScriptId(),
  } as const;
  const debounceMs = options.debounceMs ?? 500;
  let pending: T | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const parseClone = (value: unknown) => klona(options.parse(klona(value)));
  const persist = (settings: T) => updateVariablesPath(variableOption, options.key, settings);

  const save = (settings: T): T => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    pending = undefined;
    const parsed = parseClone(settings);
    persist(parsed);
    return klona(parsed);
  };

  const flush = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (pending === undefined) return;
    const value = pending;
    pending = undefined;
    persist(value);
  };

  return {
    load: () => {
      const variables = readVariablesRecord(variableOption);
      const paths = [options.key, ...(options.legacyPaths ?? [])];
      let loaded: T | undefined;

      for (const path of paths) {
        const candidate = _.get(variables, path);
        if (candidate === undefined) continue;
        try {
          loaded = parseClone(candidate);
          break;
        } catch {
          // Continue through legacy paths before falling back to defaults.
        }
      }

      return save(loaded ?? resolveDefault(options.defaultValue));
    },
    save,
    schedule: settings => {
      pending = parseClone(settings);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, debounceMs);
      return klona(pending);
    },
    flush,
    destroy: flush,
  };
}
