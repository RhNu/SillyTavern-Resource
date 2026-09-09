import { randomInt } from 'node:crypto';
import type { GenerateRequest } from './api.ts';

type Center = { x: number; y: number };
type CharacterCaption = { char_caption: string; centers: Center[] };

export type NovelAiWireRequest = {
  action: 'generate';
  input: string;
  model: GenerateRequest['model'];
  use_new_shared_trial: true;
  parameters: Record<string, unknown>;
};

export type BuiltNovelAiRequest = {
  body: NovelAiWireRequest;
  seed: number;
};

function centerOf(request: GenerateRequest, index: number, useCoords: boolean): Center {
  if (!useCoords) {
    return { x: 0.5, y: 0.5 };
  }
  return request.characters[index].position ?? { x: 0.5, y: 0.5 };
}

function captions(request: GenerateRequest, useCoords: boolean, negative: boolean): CharacterCaption[] {
  return request.characters.map((character, index) => ({
    char_caption: negative ? character.uc : character.prompt,
    centers: [centerOf(request, index, useCoords)],
  }));
}

export function buildNovelAiRequest(request: GenerateRequest): BuiltNovelAiRequest {
  const isV5 = request.model.startsWith('nai-diffusion-5');
  const useCoords =
    request.characters.length > 0 && request.characters.every(character => character.position !== undefined);
  const seed = request.sampling.seed ?? randomInt(1, 10_000_000_000);

  const positiveCharacters = captions(request, useCoords, false);
  const negativeCharacters = captions(request, useCoords, true);
  const characterPrompts = request.characters.map((character, index) => ({
    prompt: character.prompt,
    uc: character.uc,
    center: centerOf(request, index, useCoords),
    enabled: true,
  }));

  const parameters: Record<string, unknown> = {
    params_version: isV5 ? 4 : 3,
    width: request.size.width,
    height: request.size.height,
    steps: request.sampling.steps,
    scale: request.sampling.scale,
    sampler: request.sampling.sampler,
    seed,
    n_samples: 1,
    negative_prompt: request.uc,
    ucPreset: 4,
    qualityToggle: false,
    v4_prompt: {
      caption: {
        base_caption: request.prompt,
        char_captions: positiveCharacters,
      },
      use_coords: useCoords,
      use_order: true,
    },
    v4_negative_prompt: {
      caption: {
        base_caption: request.uc,
        char_captions: negativeCharacters,
      },
    },
    cfg_rescale: 0,
    noise_schedule: request.sampling.schedule,
    characterPrompts,
    legacy: false,
    legacy_v3_extend: false,
    deliberate_euler_ancestral_bug: false,
    prefer_brownian: true,
    autoSmea: false,
    use_coords: useCoords,
    ...(isV5 ? { legacy_uc: false, tag_hint_transparent_background: false } : {}),
  };

  return {
    seed,
    body: {
      action: 'generate',
      input: request.prompt,
      model: request.model,
      use_new_shared_trial: true,
      parameters,
    },
  };
}
