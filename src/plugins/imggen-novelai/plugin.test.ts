import assert from 'node:assert/strict';
import test from 'node:test';
import { zipSync } from 'fflate';
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

test('rejects unknown legacy fields instead of silently ignoring them', () => {
  const result = GenerateRequestSchema.safeParse({ ...request(), negative_prompt: 'legacy', sm: true });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.issues.map(issue => issue.message).join('\n'), /Unrecognized keys/);
  }
});

test('builds V5 structured prompts without modifying caller text', () => {
  const parsed = GenerateRequestSchema.parse(request());
  const built = buildNovelAiRequest(parsed);
  const parameters = built.body.parameters as Record<string, any>;

  assert.equal(built.body.input, '2girls, café');
  assert.equal(parameters.params_version, 4);
  assert.equal(parameters.ucPreset, 4);
  assert.equal(parameters.qualityToggle, false);
  assert.equal(parameters.v4_prompt.caption.base_caption, '2girls, café');
  assert.equal(parameters.v4_negative_prompt.caption.base_caption, 'lowres, bad anatomy');
  assert.equal(parameters.negative_prompt, 'lowres, bad anatomy');
  assert.equal(parameters.autoSmea, false);
  assert.equal(parameters.auto_smea, undefined);
  assert.equal(parameters.legacy_uc, false);
  assert.equal(parameters.tag_hint_transparent_background, false);
});

test('projects each character into all three NovelAI wire representations', () => {
  const parsed = GenerateRequestSchema.parse(request());
  const parameters = buildNovelAiRequest(parsed).body.parameters as Record<string, any>;

  assert.deepEqual(parameters.v4_prompt.caption.char_captions[0], {
    char_caption: 'girl, red hair',
    centers: [{ x: 0.25, y: 0.5 }],
  });
  assert.deepEqual(parameters.v4_negative_prompt.caption.char_captions[0], {
    char_caption: 'blue hair',
    centers: [{ x: 0.25, y: 0.5 }],
  });
  assert.deepEqual(parameters.characterPrompts[0], {
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

  assert.equal(parameters.params_version, 3);
  assert.equal(parameters.legacy_uc, undefined);
  assert.equal(parameters.tag_hint_transparent_background, undefined);
  assert.deepEqual((parameters.characterPrompts as Array<{ center: unknown }>)[0].center, { x: 0.3, y: 0.5 });
});

test('enforces V4.5 character and grid constraints', () => {
  const badGrid = GenerateRequestSchema.safeParse(
    request({
      model: 'nai-diffusion-4-5-full',
      characters: [{ prompt: 'girl', uc: '', position: { x: 0.25, y: 0.5 } }],
    }),
  );
  assert.equal(badGrid.success, false);

  const tooMany = GenerateRequestSchema.safeParse(
    request({
      model: 'nai-diffusion-4-5-curated',
      characters: Array.from({ length: 7 }, () => ({ prompt: 'girl', uc: '' })),
    }),
  );
  assert.equal(tooMany.success, false);
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
  assert.equal(result.success, false);
});

test('decodes exactly one image from the NovelAI zip response', () => {
  const decoded = decodeNovelAiImage(zipSync({ 'image_0.png': PNG, 'metadata.json': new Uint8Array([0x7b, 0x7d]) }));
  assert.equal(decoded.mime, 'image/png');
  assert.deepEqual(decoded.bytes, PNG);
});

test('rejects zip responses containing multiple images', () => {
  assert.throws(
    () => decodeNovelAiImage(zipSync({ 'image_0.png': PNG, 'image_1.png': PNG })),
    (error: unknown) => error instanceof PluginError && error.code === 'INVALID_UPSTREAM_RESPONSE',
  );
});
