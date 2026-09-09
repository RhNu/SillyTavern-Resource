import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAnchor,
  collectStoryParagraphs,
  insertAnchors,
  matchAnchors,
} from '../src/scripts/novelai-image-helper/domain/anchor.ts';
import {
  parsePromptAnalysisResponse,
  type PromptInsertion,
} from '../src/scripts/novelai-image-helper/domain/prompt.ts';
import { buildGenerateRequest } from '../src/scripts/novelai-image-helper/image-generation/build-request.ts';
import { DEFAULT_SETTINGS } from '../src/scripts/novelai-image-helper/settings/schema.ts';

const insertion: PromptInsertion = {
  after_paragraph: 2,
  summary: 'Second scene',
  prompt: {
    main: { positive: '2girls, ruins', negative: 'text' },
    characters: [
      { character_ref: 'alice', label: 'Alice', positive: 'female, red_hair', negative: 'blue_hair' },
      { character_ref: null, label: 'Stranger', positive: 'female, black_hair', negative: '' },
    ],
  },
};

test('parses the structured main and per-character prompt protocol', () => {
  const parsed = parsePromptAnalysisResponse(JSON.stringify({ version: 2, insertions: [insertion] }));
  assert.equal(parsed.insertions[0]?.prompt.main.positive, '2girls, ruins');
  assert.deepEqual(
    parsed.insertions[0]?.prompt.characters.map(character => character.positive),
    ['female, red_hair', 'female, black_hair'],
  );
  assert.throws(() => parsePromptAnalysisResponse('{"version":2,"insertions":[],"legacy":true}'));
});

test('inserts stable anchors after the selected original paragraph', () => {
  const source = 'First paragraph is long enough.\n\nSecond paragraph is also long enough.\n\nTail paragraph.';
  const paragraphs = collectStoryParagraphs(source, 20);
  const next = insertAnchors(source, paragraphs, [{ insertion, blockId: 'nai_test' }]);
  assert.match(next, /Second paragraph is also long enough\.\n\n\[\[NovelAIImage id="nai_test"\]\]/);
  assert.deepEqual(matchAnchors(next), [{ id: 'nai_test', fullMatch: buildAnchor('nai_test') }]);
});

test('maps prompt bundles to the strict imggen-novelai request without pipe syntax', () => {
  const request = buildGenerateRequest(insertion.prompt, {
    ...DEFAULT_SETTINGS.generation,
    prefix: 'artist:foo',
    suffix: 'cinematic_lighting',
    negative: 'lowres',
  });
  assert.equal(request.prompt, 'artist:foo, 2girls, ruins, cinematic_lighting');
  assert.equal(request.uc, 'lowres, text');
  assert.deepEqual(request.characters, [
    { prompt: 'female, red_hair', uc: 'blue_hair' },
    { prompt: 'female, black_hair', uc: '' },
  ]);
  assert.equal(request.prompt.includes('|'), false);
});
