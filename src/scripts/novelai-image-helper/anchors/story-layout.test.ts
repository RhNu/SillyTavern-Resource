import { describe, expect, test } from 'vitest';
import { collectCleanedFragments, type ContextCleanupSettings } from '../prompt-analysis/context-cleaner';
import { planStoryLayout, renderStoryLayout } from './story-layout';
import { applyInsertionPlan } from './insertion-plan';

const cleanup: ContextCleanupSettings = { extractRules: [], filterRules: [] };
function layoutOf(raw: string, settings = cleanup) {
  return planStoryLayout(raw, collectCleanedFragments(raw, settings).fragments);
}

describe('safe candidate anchors', () => {
  test('keeps short dialogue and marks boundaries, including the final block', () => {
    const raw = '走吧。\n\n好。';
    const layout = layoutOf(raw);
    expect(layout.blocks.map(block => [block.text, block.anchorId])).toEqual([
      ['走吧。', 'A1'],
      ['好。', 'A2'],
    ]);
    expect(renderStoryLayout(layout)).toBe('走吧。\n\n[插图锚点 A1]\n\n好。\n\n[插图锚点 A2]');
  });

  test('maps several extracted paragraphs to one wrapper boundary', () => {
    const raw = 'prefix <scene>first\n\nsecond</scene> suffix';
    const layout = layoutOf(raw, { ...cleanup, extractRules: ['<scene>'] });
    expect(layout.blocks).toEqual([{ text: 'first\nsecond', anchorId: 'A1', sourceEnd: raw.indexOf(' suffix') }]);
    const result = applyInsertionPlan(raw, layout, [{ anchorId: 'A1', imageId: 'one' }]);
    expect(result).toContain('</scene>\n\n[[NovelAIImage id="one"]]');
    expect(result.replace(/\n\n\[\[NovelAIImage id="one"\]\]\n\n/, '')).toBe(raw);
  });

  test('keeps extraction in source order and deduplicates overlapping rules', () => {
    const raw = '<a>first</a>\n\n<b>second</b>';
    const layout = layoutOf(raw, { ...cleanup, extractRules: ['<b>', '<a>', 'regex:/<a>(.*?)<[/]a>/g'] });
    expect(layout.blocks.map(block => block.text)).toEqual(['first', 'second']);
  });

  test.each([
    '<div>first\n\n<span>second</span>\n\nthird</div>',
    '- first\n\n- second\n  continued',
    '> first\n> second',
    '> first\nlazy continuation',
    '- first\nlazy continuation',
    '| Name | Value |\n| --- | --- |\n| one | two |',
    'Name | Value\n--- | ---\none | two',
  ])('does not insert inside a structural block: %s', raw => {
    const layout = layoutOf(raw);
    expect(layout.blocks).toHaveLength(1);
    expect(layout.blocks[0]?.sourceEnd).toBe(raw.length);
  });

  test('preserves the original offset after filtered text and CRLF', () => {
    const raw = '正文 <think>隐藏</think>继续。\r\n\r\n短句。';
    const layout = layoutOf(raw, { ...cleanup, filterRules: ['block:<think>'] });
    expect(layout.blocks[0]?.sourceEnd).toBe(raw.indexOf('\r\n'));
    expect(layout.blocks.map(block => block.text)).toEqual(['正文 继续。', '短句。']);
  });

  test('unclosed HTML stays readable but cannot produce an insertion point inside the wrapper', () => {
    const layout = layoutOf('before\n\n<div>unclosed\n\ntext');
    expect(layout.blocks.map(block => block.anchorId)).toEqual(['A1', null]);
    expect(renderStoryLayout(layout)).toContain('<div>unclosed\ntext');
    expect(renderStoryLayout(layout)).not.toContain('A2');
  });

  test('a replacement containing newlines cannot invent insertion points inside the source match', () => {
    const raw = 'left SECRET right';
    const layout = layoutOf(raw, { ...cleanup, filterRules: ['regex:/SECRET/g=>first\nsecond'] });
    expect(layout.blocks).toHaveLength(1);
    expect(layout.blocks[0]?.sourceEnd).toBe(raw.length);
  });

  test.each(['```js\nsecret\n\nmore\n```', '~~~\nsecret\n\nmore\n~~~', '```\nnot closed'])(
    'code is opaque: %s',
    code => {
      const raw = `before\n\n${code}`;
      const layout = layoutOf(raw);
      expect(layout.blocks.map(block => block.text)).toEqual(['before']);
    },
  );

  test('rejects duplicate selections and keeps insertion offsets stable in reverse order', () => {
    const raw = 'one\n\ntwo';
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
    expect(result.replace(/\n\n\[\[NovelAIImage id="[^"]+"\]\]\n\n/g, '')).toBe(raw);
  });
});
