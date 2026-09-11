import { describe, expect, test } from 'vitest';
import { collectCleanedFragments, type ContextCleanupSettings } from '../prompt-analysis/context-cleaner';
import { applyInsertionPlan } from './insertion-plan';
import { planStoryLayout, renderStoryLayout } from './story-layout';

const cleanup: ContextCleanupSettings = { storyRules: [], cleanupRules: [] };

function layoutOf(raw: string, settings = cleanup) {
  return planStoryLayout(raw, collectCleanedFragments(raw, settings).fragments);
}

describe('line-based story anchors', () => {
  test('creates one candidate after every non-empty line and ignores blank lines', () => {
    const layout = layoutOf('第一行\n\n第二行\n   \n第三行');
    expect(layout.blocks.map(block => [block.text, block.anchorId])).toEqual([
      ['第一行', 'A1'],
      ['第二行', 'A2'],
      ['第三行', 'A3'],
    ]);
    expect(renderStoryLayout(layout)).toBe(
      '第一行\n\n[插图锚点 A1]\n\n第二行\n\n[插图锚点 A2]\n\n第三行\n\n[插图锚点 A3]',
    );
  });

  test('places anchors inside a selected story wrapper instead of folding them to its end', () => {
    const raw = 'prefix <scene>first\n\nsecond</scene> suffix';
    const layout = layoutOf(raw, { ...cleanup, storyRules: ['<scene>'] });
    expect(layout.blocks.map(block => [block.text, block.anchorId])).toEqual([
      ['first', 'A1'],
      ['second', 'A2'],
    ]);

    const result = applyInsertionPlan(raw, layout, [
      { anchorId: 'A1', imageId: 'one' },
      { anchorId: 'A2', imageId: 'two' },
    ]);
    expect(result).toContain('first\n\n[[NovelAIImage id="one"]]\n\n\n\nsecond');
    expect(result).toContain('second\n\n[[NovelAIImage id="two"]]\n\n</scene>');
    expect(result.replace(/\n\n\[\[NovelAIImage id="(?:one|two)"\]\]\n\n/g, '')).toBe(raw);
  });

  test('uses all matching story regions in source order and removes overlaps', () => {
    const raw = '<outer>first <inner>nested</inner></outer>\n<outer>second</outer>';
    const layout = layoutOf(raw, { ...cleanup, storyRules: ['<inner>', '<outer>'] });
    expect(layout.blocks.map(block => block.text)).toEqual(['first <inner>nested</inner>', 'second']);
  });

  test('falls back to the complete message when no story rule matches', () => {
    const layout = layoutOf('first\nsecond', { ...cleanup, storyRules: ['<missing>'] });
    expect(layout.blocks.map(block => block.text)).toEqual(['first', 'second']);
  });

  test('cleans selected story before creating line candidates', () => {
    const raw = '<story>first\n<think>hidden</think>\nsecond</story>';
    const layout = layoutOf(raw, {
      storyRules: ['<story>'],
      cleanupRules: ['block:<think>'],
    });
    expect(layout.blocks.map(block => block.text)).toEqual(['first', 'second']);
  });

  test('keeps source offsets stable after filtered text and CRLF', () => {
    const raw = '正文 <think>隐藏</think>继续。\r\n\r\n短句。';
    const layout = layoutOf(raw, { ...cleanup, cleanupRules: ['block:<think>'] });
    expect(layout.blocks[0]?.sourceEnd).toBe(raw.indexOf('\r\n'));
    expect(layout.blocks.map(block => block.text)).toEqual(['正文 继续。', '短句。']);
  });

  test('rejects duplicate selections and inserts distinct anchors in source order', () => {
    const raw = 'one\ntwo';
    const layout = layoutOf(raw);
    expect(() =>
      applyInsertionPlan(raw, layout, [
        { anchorId: 'A1', imageId: 'x' },
        { anchorId: 'A1', imageId: 'y' },
      ]),
    ).toThrow('重复');

    const result = applyInsertionPlan(raw, layout, [
      { anchorId: 'A2', imageId: 'second' },
      { anchorId: 'A1', imageId: 'first' },
    ]);
    expect(result.indexOf('id="first"')).toBeLessThan(result.indexOf('two'));
    expect(result.indexOf('two')).toBeLessThan(result.indexOf('id="second"'));
  });
});
