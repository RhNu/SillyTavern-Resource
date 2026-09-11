import { expect, test } from 'vitest';
import { DEFAULT_PROMPT_TEMPLATE, DEFAULT_SETTINGS, normalizeSettings } from './schema';

test('keeps both default prompt templates concise and separates scene from character details', () => {
  expect(DEFAULT_PROMPT_TEMPLATE.v45).toContain('Keep the main prompt compact');
  expect(DEFAULT_PROMPT_TEMPLATE.v45).toContain('Keep each character prompt about that character alone');
  expect(DEFAULT_PROMPT_TEMPLATE.v45).toContain('In every positive and negative field');
  expect(DEFAULT_PROMPT_TEMPLATE.v5).toContain('prompt fields must still stay short and direct');
  expect(DEFAULT_PROMPT_TEMPLATE.v5).toContain('compact Danbooru-style tags, or a mixture of both');
  expect(DEFAULT_PROMPT_TEMPLATE.v5).toContain('Avoid overlap between all prompt fields');
  expect(DEFAULT_PROMPT_TEMPLATE.v5).toContain(
    'Omit quality and rendering-quality terms from every positive and negative field',
  );
});

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

test('migrates v9 settings while dropping the browser upload timeout', () => {
  const settings = structuredClone(DEFAULT_SETTINGS) as typeof DEFAULT_SETTINGS & {
    generation: typeof DEFAULT_SETTINGS.generation & { uploadTimeoutMs?: number };
  };
  settings.schemaVersion = 9 as 10;
  settings.analysis.model = 'kept-model';
  settings.generation.uploadTimeoutMs = 45_000;

  expect(normalizeSettings(settings)).toEqual({
    ...DEFAULT_SETTINGS,
    analysis: { ...DEFAULT_SETTINGS.analysis, model: 'kept-model' },
  });
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
