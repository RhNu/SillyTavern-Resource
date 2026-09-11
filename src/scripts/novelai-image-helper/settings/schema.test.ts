import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from './schema';

test('keeps valid current settings unchanged', () => {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.analysis.model = 'custom-model';
  settings.analysis.cleanup.extractRules = ['<scene>'];
  settings.generation.steps = 17;
  expect(normalizeSettings(settings)).toEqual(settings);
});

test('falls back to defaults for an obsolete settings schema', () => {
  expect(normalizeSettings({ ...structuredClone(DEFAULT_SETTINGS), schemaVersion: 7 })).toEqual(DEFAULT_SETTINGS);
});
