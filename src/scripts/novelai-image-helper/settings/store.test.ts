import { describe, expect, test, vi } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from './schema';
import { SettingsStore } from './store';

describe('SettingsStore persistence', () => {
  test('routes immediate and debounced updates through the shared synchronizer', () => {
    const save = vi.fn((settings: Settings) => structuredClone(settings));
    const schedule = vi.fn((settings: Settings) => structuredClone(settings));
    const flush = vi.fn();
    const destroy = vi.fn();
    const store = new SettingsStore({
      load: () => structuredClone(DEFAULT_SETTINGS),
      save,
      schedule,
      flush,
      destroy,
    });

    store.update(settings => {
      settings.analysis.auto = true;
    });
    store.update(
      settings => {
        settings.generation.steps = 24;
      },
      { debounced: true },
    );

    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0]![0].analysis.auto).toBe(true);
    expect(schedule).toHaveBeenCalledOnce();
    expect(schedule.mock.calls[0]![0].generation.steps).toBe(24);

    store.flush();
    store.destroy();
    expect(flush).toHaveBeenCalledOnce();
    expect(destroy).toHaveBeenCalledOnce();
  });
});
