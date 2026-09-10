import type { Settings } from '../settings/schema.ts';

export type ImageModelFamily = 'v45' | 'v5';

export function imageModelFamily(model: Settings['generation']['model']): ImageModelFamily {
  return model.startsWith('nai-diffusion-5') ? 'v5' : 'v45';
}

export function resolveSelectedTemplate(settings: Settings): string {
  return settings.analysis.templates[imageModelFamily(settings.generation.model)];
}
