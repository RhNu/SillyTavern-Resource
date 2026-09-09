import type { PromptBundle } from '../domain/prompt.ts';
import { joinPromptParts } from '../domain/prompt.ts';
import type { Settings } from '../settings/schema.ts';

export function buildGenerateRequest(bundle: PromptBundle, settings: Settings['generation']) {
  return {
    model: settings.model,
    prompt: joinPromptParts(settings.prefix, bundle.main.positive, settings.suffix),
    uc: joinPromptParts(settings.negative, bundle.main.negative),
    characters: bundle.characters.map(character => ({
      prompt: character.positive,
      uc: character.negative,
    })),
    size: { width: settings.width, height: settings.height },
    sampling: {
      steps: settings.steps,
      scale: settings.scale,
      sampler: settings.sampler,
      schedule: settings.schedule,
      seed: settings.seed,
    },
  };
}
