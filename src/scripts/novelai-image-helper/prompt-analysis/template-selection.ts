import type { Settings } from '../settings/schema.ts';

export type ImageModelFamily = 'v45' | 'v5';

export function imageModelFamily(model: Settings['generation']['model']): ImageModelFamily {
  return model.startsWith('nai-diffusion-5') ? 'v5' : 'v45';
}

export function resolveSelectedTemplate(settings: Settings): string {
  const selected = settings.analysis.templates.items[settings.analysis.templates.selected];
  if (!selected) throw new Error(`提示词模板不存在: ${settings.analysis.templates.selected}`);
  return selected[imageModelFamily(settings.generation.model)];
}
