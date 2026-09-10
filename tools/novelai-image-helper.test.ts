import { describe, expect, test } from 'vitest';
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
import { characterMatchesContext } from '../src/scripts/novelai-image-helper/domain/binding.ts';
import {
  imageModelFamily,
  resolveSelectedTemplate,
} from '../src/scripts/novelai-image-helper/prompt-analysis/template-selection.ts';
import { DEFAULT_SETTINGS } from '../src/scripts/novelai-image-helper/settings/schema.ts';

const insertion: PromptInsertion = {
  after_paragraph: 2,
  summary: 'Second scene',
  prompt: {
    main: { positive: '2girls, ruins', negative: 'text' },
    characters: [
      { label: 'Alice', positive: 'female, red_hair', negative: 'blue_hair' },
      { label: 'Stranger', positive: 'female, black_hair', negative: '' },
    ],
  },
};

describe('NovelAI image helper domain', () => {
  test('parses the structured main and per-character prompt protocol', () => {
    const parsed = parsePromptAnalysisResponse(JSON.stringify({ version: 2, insertions: [insertion] }));
    expect(parsed.insertions[0]?.prompt.main.positive).toBe('2girls, ruins');
    expect(parsed.insertions[0]?.prompt.characters.map(character => character.positive)).toEqual([
      'female, red_hair',
      'female, black_hair',
    ]);
    expect(() => parsePromptAnalysisResponse('{"version":2,"insertions":[],"legacy":true}')).toThrow();
  });

  test('inserts stable anchors after the selected original paragraph', () => {
    const source = 'First paragraph is long enough.\n\nSecond paragraph is also long enough.\n\nTail paragraph.';
    const paragraphs = collectStoryParagraphs(source, 20);
    const next = insertAnchors(source, paragraphs, [{ insertion, blockId: 'nai_test' }]);
    expect(next).toMatch(/Second paragraph is also long enough\.\n\n\[\[NovelAIImage id="nai_test"\]\]/);
    expect(matchAnchors(next)).toEqual([{ id: 'nai_test', fullMatch: buildAnchor('nai_test') }]);
  });

  test('maps prompt bundles to the strict imggen-novelai request without pipe syntax', () => {
    const request = buildGenerateRequest(insertion.prompt, {
      ...DEFAULT_SETTINGS.generation,
      prefix: 'artist:foo',
      suffix: 'cinematic_lighting',
      negative: 'lowres',
    });
    expect(request.prompt).toBe('artist:foo, 2girls, ruins, cinematic_lighting');
    expect(request.uc).toBe('lowres, text');
    expect(request.characters).toEqual([
      { prompt: 'female, red_hair', uc: 'blue_hair' },
      { prompt: 'female, black_hair', uc: '' },
    ]);
    expect(request.prompt).not.toContain('|');
  });

  test('selects model-specific prompt rules', () => {
    expect(imageModelFamily('nai-diffusion-4-5-full')).toBe('v45');
    expect(imageModelFamily('nai-diffusion-5-curated')).toBe('v5');
    expect(resolveSelectedTemplate(DEFAULT_SETTINGS)).toContain('Chinese is allowed');
  });

  test('requires every configured character binding to match', () => {
    const bindings = {
      character: { key: 'card-a', label: 'Card A' },
      chat: { key: 'chat-a', label: 'Chat A' },
      persona: null,
    };
    expect(
      characterMatchesContext(bindings, {
        character: { key: 'card-a', label: 'Card A' },
        chat: { key: 'chat-a', label: 'Chat A' },
        persona: null,
      }),
    ).toBe(true);
    expect(
      characterMatchesContext(bindings, {
        character: { key: 'card-a', label: 'Card A' },
        chat: { key: 'chat-b', label: 'Chat B' },
        persona: null,
      }),
    ).toBe(false);
  });
});
