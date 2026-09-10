import type { PromptBundle } from '../domain/prompt.ts';
import { joinPromptParts } from '../domain/prompt.ts';
import type { Settings } from '../settings/schema.ts';

function resolvePromptPreset(
  settings: Settings['generation'],
): Settings['generation']['promptPresets']['items'][string] {
  const preset = settings.promptPresets.items[settings.promptPresets.selected];
  if (!preset) throw new Error(`提示词预设不存在: ${settings.promptPresets.selected}`);
  return preset;
}

export function buildGenerateRequest(bundle: PromptBundle, settings: Settings['generation']) {
  const promptPreset = resolvePromptPreset(settings);
  return {
    model: settings.model,
    prompt: joinPromptParts(promptPreset.prefix, bundle.main.positive, promptPreset.suffix),
    uc: joinPromptParts(promptPreset.negative, bundle.main.negative),
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
