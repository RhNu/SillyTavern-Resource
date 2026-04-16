export type PromptInjectionMode = 'plain' | 'nai';

type PromptAssemblyOptions = {
  prefix: string;
  suffix: string;
  injectionMode: PromptInjectionMode;
};

function normalizePromptPart(value: string): string {
  return value.trim().replace(/^,+|,+$/g, '').trim();
}

function joinPromptParts(parts: string[]): string {
  return parts
    .map(normalizePromptPart)
    .filter(Boolean)
    .join(', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(?:,\s*){2,}/g, ', ')
    .trim();
}

export function buildFinalImagePrompt(prompt: string, options: PromptAssemblyOptions): string {
  const trimmedPrompt = prompt.trim();
  if (options.injectionMode !== 'nai' || !trimmedPrompt.includes('|')) {
    return joinPromptParts([options.prefix, trimmedPrompt, options.suffix]);
  }

  const parts = trimmedPrompt
    .split('|')
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return joinPromptParts([options.prefix, trimmedPrompt, options.suffix]);
  }

  const [scenePrompt, ...characterPrompts] = parts;
  const mainPrompt = joinPromptParts([options.prefix, scenePrompt ?? '', options.suffix]);

  return [mainPrompt, ...characterPrompts].filter(Boolean).join(' | ').trim();
}
