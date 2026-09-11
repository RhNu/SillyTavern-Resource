import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from './schema';

test('keeps valid current settings unchanged', () => {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.analysis.model = 'custom-model';
  settings.analysis.cleanup.storyRules = ['<scene>'];
  settings.generation.steps = 17;
  expect(normalizeSettings(settings)).toEqual(settings);
});

test('falls back to defaults for an obsolete settings schema', () => {
  expect(normalizeSettings({ ...structuredClone(DEFAULT_SETTINGS), schemaVersion: 8 })).toEqual(DEFAULT_SETTINGS);
});

test('adds the progress toast preference without discarding existing settings', () => {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.analysis.model = 'custom-model';
  delete (settings as Partial<typeof settings>).notifications;

  expect(normalizeSettings(settings)).toEqual({
    ...settings,
    notifications: { progressToast: true },
  });
});
