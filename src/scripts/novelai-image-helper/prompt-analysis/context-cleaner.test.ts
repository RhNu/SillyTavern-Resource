import { planStoryLayout } from '../anchors/story-layout';
import { describe, expect, test } from 'vitest';
import { cleanContextText, collectCleanedFragments, type ContextCleanupSettings } from './context-cleaner';

const emptyCleanup: ContextCleanupSettings = { storyRules: [], cleanupRules: [] };

describe('context cleanup', () => {
  test('supports tag-oriented cleanup operations locally', () => {
    const result = cleanContextText(
      'keep <think>hidden</think> START remove until END visible [debug]gone[/debug] REMOVE',
      {
        storyRules: [],
        cleanupRules: ['block:<think>', 'pair:START|END', 'block:[debug]', 'text:REMOVE'],
      },
    );

    expect(result.text).toBe('keep   visible');
    expect(result.diagnostics).toEqual([]);
  });

  test('removes current image anchors from story context', () => {
    expect(cleanContextText('before [[NovelAIImage id="new"]] after', emptyCleanup).text).toBe('before  after');
  });

  test('supports before and after boundaries in rule order', () => {
    expect(
      cleanContextText('discard </analysis> keep <cut>discard', {
        ...emptyCleanup,
        cleanupRules: ['before:</analysis>', 'after:<cut>'],
      }).text,
    ).toBe('keep');
  });

  test('extracts HTML, bracket, and paired regions', () => {
    expect(
      cleanContextText('<scene>first</scene> [scene]second[/scene] prefixthirdsuffix', {
        storyRules: ['<scene>', '[scene]', 'prefix|suffix'],
        cleanupRules: [],
      }).text,
    ).toBe('first\nsecond\nthird');
  });

  test('accepts comma-separated ordinary extraction rules while preserving regex literals', () => {
    expect(
      cleanContextText('<scene>first</scene>[scene]second[/scene]', {
        storyRules: ['<scene>,[scene]'],
        cleanupRules: [],
      }).text,
    ).toBe('first\nsecond');
  });

  test('supports internal regex rules and literal replacement text', () => {
    const result = cleanContextText('A <debug id="1">secret</debug> B  C', {
      storyRules: [],
      cleanupRules: ['regex:/<debug\\b[^>]*>[\\s\\S]*?<\\/debug>/gi', 'regex:/[ \\t]+/g=> '],
    });

    expect(result.text).toBe('A B C');
    expect(result.diagnostics).toEqual([]);
  });

  test('reports invalid internal regex without throwing during cleanup', () => {
    const result = cleanContextText('visible', {
      storyRules: [],
      cleanupRules: ['regex:/[/g', 'text:visible'],
    });

    expect(result.text).toBe('');
    expect(result.diagnostics).toEqual([expect.objectContaining({ phase: 'cleanup', rule: 'regex:/[/g' })]);
  });

  test('rejects replacement syntax in story selectors', () => {
    const result = cleanContextText('visible', {
      storyRules: ['regex:/visible/g=>changed'],
      cleanupRules: [],
    });

    expect(result.text).toBe('visible');
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ phase: 'story', message: expect.stringContaining('不能包含替换文本') }),
    ]);
  });

  test('keeps cleaned paragraph text while mapping insertion positions to the original message', () => {
    const original = 'First <think>hidden</think> paragraph.\n\nSecond paragraph.';
    const result = collectCleanedFragments(original, {
      storyRules: [],
      cleanupRules: ['block:<think>'],
    });

    expect(result.fragments.map(fragment => fragment.text)).toEqual(['First  paragraph.', 'Second paragraph.']);
    expect(result.fragments[0]).toMatchObject({
      start: 0,
      end: original.indexOf('\n\n'),
    });
  });

  test('maps extracted paragraphs after their complete source wrapper', () => {
    const original = 'prefix <scene>selected illustration moment</scene> suffix';
    const result = collectCleanedFragments(original, {
      storyRules: ['<scene>'],
      cleanupRules: [],
    });

    expect(result.fragments[0]).toMatchObject({
      text: 'selected illustration moment',
      end: original.indexOf('</scene>'),
    });
  });

  test('retains short lines without a minimum-length threshold', () => {
    const original = '是。\n好。\n走吧。';
    const result = collectCleanedFragments(original, emptyCleanup);
    const layout = planStoryLayout(original, result.fragments);
    expect(layout.blocks.map(block => block.text)).toEqual(['是。', '好。', '走吧。']);
    expect(layout.blocks.map(block => block.anchorId)).toEqual(['A1', 'A2', 'A3']);
  });
});
