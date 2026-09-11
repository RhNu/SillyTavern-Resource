import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings/schema';
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
