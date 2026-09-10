import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../settings/schema';
import { deleteSelectedPromptPreset, savePromptPreset } from './settings-model';

describe('image prompt preset editing', () => {
  test('saves a copy of the current preset and selects it', () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    const current = settings.generation.promptPresets.items[settings.generation.promptPresets.selected]!;
    current.prefix = 'masterpiece';

    const next = savePromptPreset(settings, '动漫风');

    expect(next.generation.promptPresets.selected).toBe('动漫风');
    expect(next.generation.promptPresets.items['动漫风']).toEqual(current);
    expect(next.generation.promptPresets.items['动漫风']).not.toBe(current);
    expect(settings.generation.promptPresets.selected).toBe('NovelAI 默认');
  });

  test('rejects empty and duplicate names', () => {
    const settings = structuredClone(DEFAULT_SETTINGS);

    expect(() => savePromptPreset(settings, '  ')).toThrow('提示词预设名称不能为空');
    expect(() => savePromptPreset(settings, ' NovelAI 默认 ')).toThrow('提示词预设“NovelAI 默认”已经存在');
  });

  test('deletes the selected preset but keeps one preset available', () => {
    const withSecondPreset = savePromptPreset(structuredClone(DEFAULT_SETTINGS), '第二套');
    const next = deleteSelectedPromptPreset(withSecondPreset);

    expect(next.generation.promptPresets.items['第二套']).toBeUndefined();
    expect(next.generation.promptPresets.selected).toBe('NovelAI 默认');
    expect(() => deleteSelectedPromptPreset(next)).toThrow('至少需要保留一个提示词预设');
  });
});

describe('settings v2 migration', () => {
  test('keeps the selected model template and legacy generation prompt fields', () => {
    const legacy = {
      ...structuredClone(DEFAULT_SETTINGS),
      schemaVersion: 2,
      analysis: {
        ...structuredClone(DEFAULT_SETTINGS.analysis),
        templates: {
          selected: '自定义规则',
          items: {
            自定义规则: { v45: 'v45 custom', v5: 'v5 custom' },
          },
        },
      },
      generation: {
        ...structuredClone(DEFAULT_SETTINGS.generation),
        prefix: 'prefix custom',
        suffix: 'suffix custom',
        negative: 'negative custom',
      },
    };

    const normalized = normalizeSettings(legacy);

    expect(normalized.schemaVersion).toBe(3);
    expect(normalized.analysis.templates).toEqual({ v45: 'v45 custom', v5: 'v5 custom' });
    expect(normalized.generation.promptPresets.selected).toBe('NovelAI 默认');
    expect(normalized.generation.promptPresets.items['NovelAI 默认']).toEqual({
      prefix: 'prefix custom',
      suffix: 'suffix custom',
      negative: 'negative custom',
    });
  });
});
