import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS, legacyAnchorTemplateWarning, normalizeSettings } from './schema';

test('v7 removes the obsolete threshold while preserving all user configuration', () => {
  const settings = structuredClone(DEFAULT_SETTINGS);
  settings.analysis.model = 'custom-model';
  settings.analysis.cleanup.extractRules = ['<scene>'];
  settings.analysis.templates.v5 = 'custom after_paragraph rules';
  settings.generation.steps = 17;
  const migrated = normalizeSettings({
    ...settings,
    schemaVersion: 7,
    analysis: { ...settings.analysis, minimumParagraphLength: 1999 },
  });
  expect(migrated).toEqual(settings);
  expect(migrated.analysis).not.toHaveProperty('minimumParagraphLength');
  expect(legacyAnchorTemplateWarning(migrated)).toContain('anchor_id');
  expect(normalizeSettings(migrated)).toEqual(migrated);
  expect(legacyAnchorTemplateWarning(DEFAULT_SETTINGS)).toBeUndefined();
});
