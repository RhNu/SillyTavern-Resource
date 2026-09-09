import { zipSync } from 'fflate';
import { describe, expect, test } from 'vitest';
import { GenerateRequestSchema } from './api.ts';
import { PluginError } from './errors.ts';
import { decodeNovelAiImage } from './response.ts';
import { buildNovelAiRequest } from './wire.ts';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function request(overrides: Record<string, unknown> = {}) {
  return {
    model: 'nai-diffusion-5-full',
    prompt: '2girls, café',
    uc: 'lowres, bad anatomy',
    characters: [
      { prompt: 'girl, red hair', uc: 'blue hair', position: { x: 0.25, y: 0.5 } },
      { prompt: 'girl, blue hair', uc: 'red hair', position: { x: 0.75, y: 0.5 } },
    ],
    size: { width: 1216, height: 832 },
    sampling: {
      steps: 23,
      scale: 7,
      sampler: 'k_euler_ancestral',
      schedule: 'karras',
      seed: 123456789,
    },
    ...overrides,
  };
}

describe('imggen-novelai plugin protocol', () => {
  test('rejects unknown legacy fields instead of silently ignoring them', () => {
    const result = GenerateRequestSchema.safeParse({ ...request(), negative_prompt: 'legacy', sm: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.message).join('\n')).toMatch(/Unrecognized keys/);
    }
  });

  test('builds V5 structured prompts without modifying caller text', () => {
    const parsed = GenerateRequestSchema.parse(request());
    const built = buildNovelAiRequest(parsed);
    const parameters = built.body.parameters as Record<string, any>;

    expect(built.body.input).toBe('2girls, café');
    expect(parameters.params_version).toBe(4);
    expect(parameters.ucPreset).toBe(4);
    expect(parameters.qualityToggle).toBe(false);
    expect(parameters.v4_prompt.caption.base_caption).toBe('2girls, café');
    expect(parameters.v4_negative_prompt.caption.base_caption).toBe('lowres, bad anatomy');
    expect(parameters.negative_prompt).toBe('lowres, bad anatomy');
    expect(parameters.autoSmea).toBe(false);
    expect(parameters.auto_smea).toBeUndefined();
    expect(parameters.legacy_uc).toBe(false);
    expect(parameters.tag_hint_transparent_background).toBe(false);
  });

  test('projects each character into all three NovelAI wire representations', () => {
    const parsed = GenerateRequestSchema.parse(request());
    const parameters = buildNovelAiRequest(parsed).body.parameters as Record<string, any>;

    expect(parameters.v4_prompt.caption.char_captions[0]).toEqual({
      char_caption: 'girl, red hair',
      centers: [{ x: 0.25, y: 0.5 }],
    });
    expect(parameters.v4_negative_prompt.caption.char_captions[0]).toEqual({
      char_caption: 'blue hair',
      centers: [{ x: 0.25, y: 0.5 }],
    });
    expect(parameters.characterPrompts[0]).toEqual({
      prompt: 'girl, red hair',
      uc: 'blue hair',
      center: { x: 0.25, y: 0.5 },
      enabled: true,
    });
  });

  test('uses the V4.5 wire version without V5-only fields', () => {
    const parsed = GenerateRequestSchema.parse(
      request({
        model: 'nai-diffusion-4-5-full',
        characters: [{ prompt: 'girl, red hair', uc: '', position: { x: 0.3, y: 0.5 } }],
        sampling: { steps: 23, scale: 5, seed: 42 },
      }),
    );
    const parameters = buildNovelAiRequest(parsed).body.parameters;

    expect(parameters.params_version).toBe(3);
    expect(parameters.legacy_uc).toBeUndefined();
    expect(parameters.tag_hint_transparent_background).toBeUndefined();
    expect((parameters.characterPrompts as Array<{ center: unknown }>)[0].center).toEqual({ x: 0.3, y: 0.5 });
  });

  test('enforces V4.5 character and grid constraints', () => {
    const badGrid = GenerateRequestSchema.safeParse(
      request({
        model: 'nai-diffusion-4-5-full',
        characters: [{ prompt: 'girl', uc: '', position: { x: 0.25, y: 0.5 } }],
      }),
    );
    expect(badGrid.success).toBe(false);

    const tooMany = GenerateRequestSchema.safeParse(
      request({
        model: 'nai-diffusion-4-5-curated',
        characters: Array.from({ length: 7 }, () => ({ prompt: 'girl', uc: '' })),
      }),
    );
    expect(tooMany.success).toBe(false);
  });

  test('requires all characters to participate in manual positioning', () => {
    const result = GenerateRequestSchema.safeParse(
      request({
        characters: [
          { prompt: 'girl', uc: '', position: { x: 0.25, y: 0.5 } },
          { prompt: 'boy', uc: '' },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });

  test('decodes exactly one image from the NovelAI zip response', () => {
    const decoded = decodeNovelAiImage(zipSync({ 'image_0.png': PNG, 'metadata.json': new Uint8Array([0x7b, 0x7d]) }));
    expect(decoded.mime).toBe('image/png');
    expect(decoded.bytes).toEqual(PNG);
  });

  test('rejects zip responses containing multiple images', () => {
    const decodeMultipleImages = () => decodeNovelAiImage(zipSync({ 'image_0.png': PNG, 'image_1.png': PNG }));

    expect(decodeMultipleImages).toThrowError(PluginError);
    expect(decodeMultipleImages).toThrowError(expect.objectContaining({ code: 'INVALID_UPSTREAM_RESPONSE' }));
  });
});
