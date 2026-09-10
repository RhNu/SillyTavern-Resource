import { describe, expect, test } from 'vitest';
import { cleanContextText, collectCleanedStoryParagraphs, type ContextCleanupSettings } from './context-cleaner';

const emptyCleanup: ContextCleanupSettings = { extractRules: [], filterRules: [] };

describe('context cleanup', () => {
  test('supports the legacy tag-oriented filter operations locally', () => {
    const result = cleanContextText(
      'keep <think>hidden</think> START remove until END visible [debug]gone[/debug] REMOVE',
      {
        extractRules: [],
        filterRules: ['block:<think>', 'pair:START|END', 'block:[debug]', 'text:REMOVE'],
      },
    );

    expect(result.text).toBe('keep   visible');
    expect(result.diagnostics).toEqual([]);
  });

  test('removes both current and old image anchors from story context', () => {
    expect(
      cleanContextText('before [[NovelAIImage id="new"]] middle [[ImageGenRef id="old"]] after', emptyCleanup).text,
    ).toBe('before  middle  after');
  });

  test('supports before and after boundaries in rule order', () => {
    expect(
      cleanContextText('discard </analysis> keep <cut>discard', {
        ...emptyCleanup,
        filterRules: ['before:</analysis>', 'after:<cut>'],
      }).text,
    ).toBe('keep');
  });

  test('extracts HTML, bracket, and paired regions', () => {
    expect(
      cleanContextText('<scene>first</scene> [scene]second[/scene] prefixthirdsuffix', {
        extractRules: ['<scene>', '[scene]', 'prefix|suffix'],
        filterRules: [],
      }).text,
    ).toBe('first\n\nsecond\n\nthird');
  });

  test('accepts comma-separated ordinary extraction rules while preserving regex literals', () => {
    expect(
      cleanContextText('<scene>first</scene>[scene]second[/scene]', {
        extractRules: ['<scene>,[scene]'],
        filterRules: [],
      }).text,
    ).toBe('first\n\nsecond');
  });

  test('supports internal regex rules and literal replacement text', () => {
    const result = cleanContextText('A <debug id="1">secret</debug> B  C', {
      extractRules: [],
      filterRules: ['regex:/<debug\\b[^>]*>[\\s\\S]*?<\\/debug>/gi', 'regex:/\\s+/g=> '],
    });

    expect(result.text).toBe('A B C');
    expect(result.diagnostics).toEqual([]);
  });

  test('reports invalid internal regex without throwing during cleanup', () => {
    const result = cleanContextText('visible', {
      extractRules: [],
      filterRules: ['regex:/[/g', 'text:visible'],
    });

    expect(result.text).toBe('');
    expect(result.diagnostics).toEqual([expect.objectContaining({ phase: 'filter', rule: 'regex:/[/g' })]);
  });

  test('keeps cleaned paragraph text while mapping insertion positions to the original message', () => {
    const original = 'First <think>hidden</think> paragraph.\n\nSecond paragraph.';
    const result = collectCleanedStoryParagraphs(original, 10, {
      extractRules: [],
      filterRules: ['block:<think>'],
    });

    expect(result.paragraphs.map(paragraph => paragraph.text)).toEqual(['First  paragraph.', 'Second paragraph.']);
    expect(result.paragraphs[0]).toMatchObject({
      sourceStart: 0,
      sourceEnd: original.indexOf('\n\n'),
      end: original.indexOf('\n\n'),
    });
  });

  test('maps extracted paragraphs after their complete source wrapper', () => {
    const original = 'prefix <scene>selected illustration moment</scene> suffix';
    const result = collectCleanedStoryParagraphs(original, 10, {
      extractRules: ['<scene>'],
      filterRules: [],
    });

    expect(result.paragraphs[0]).toMatchObject({
      text: 'selected illustration moment',
      sourceEnd: original.indexOf('</scene>') + '</scene>'.length,
    });
  });

  test('falls back to single-newline paragraph boundaries for long text', () => {
    const result = collectCleanedStoryParagraphs(
      `${'a'.repeat(160)}\n${'b'.repeat(160)}\n${'c'.repeat(160)}`,
      100,
      emptyCleanup,
    );

    expect(result.paragraphs).toHaveLength(3);
    expect(result.paragraphs.map(paragraph => paragraph.number)).toEqual([1, 2, 3]);
  });
});
