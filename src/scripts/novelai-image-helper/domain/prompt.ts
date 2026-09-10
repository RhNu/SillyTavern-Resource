import { z } from 'zod';

export const PromptTextSchema = z.strictObject({
  positive: z.string().trim().min(1).max(100_000).describe('Main scene prompt using the selected model rules.'),
  negative: z.string().trim().max(100_000).describe('Undesired scene-level content; empty when unnecessary.'),
});

export const CharacterPromptSchema = z.strictObject({
  label: z.string().trim().min(1).max(120).describe('Human-readable character label for editing.'),
  positive: z.string().trim().min(1).max(50_000).describe('Prompt for this character only.'),
  negative: z.string().trim().max(50_000).describe('Undesired features for this character; empty when unnecessary.'),
});

export const PromptBundleSchema = z.strictObject({
  main: PromptTextSchema,
  characters: z.array(CharacterPromptSchema).max(22),
});

export const PromptInsertionSchema = z.strictObject({
  after_paragraph: z.number().int().positive().describe('Latest-story paragraph number after which to insert.'),
  summary: z.string().trim().max(500).describe('Short scene-selection rationale.'),
  prompt: PromptBundleSchema,
});

export const PromptAnalysisResponseSchema = z.strictObject({
  insertions: z.array(PromptInsertionSchema).max(8),
});

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Keep the wire schema to the common subset accepted by OpenAI function tools
 * and Gemini's OpenAI-compatible FunctionDeclaration. Zod remains the source
 * of truth for validating the returned tool arguments locally.
 */
function toCrossProviderToolSchema(value: unknown): Record<string, unknown> {
  if (!isJsonObject(value)) {
    return {};
  }

  const result: Record<string, unknown> = {};

  if (typeof value.type === 'string') {
    result.type = value.type;
  }

  if (typeof value.description === 'string') {
    result.description = value.description;
  }

  if (Array.isArray(value.enum) && value.enum.every(item => typeof item === 'string')) {
    result.enum = value.enum;
  }

  if (isJsonObject(value.properties)) {
    result.properties = Object.fromEntries(
      Object.entries(value.properties).map(([name, property]) => [name, toCrossProviderToolSchema(property)]),
    );
  }

  if (Array.isArray(value.required) && value.required.every(item => typeof item === 'string')) {
    result.required = value.required;
  }

  if (isJsonObject(value.items)) {
    result.items = toCrossProviderToolSchema(value.items);
  }

  return result;
}

export type PromptBundle = z.infer<typeof PromptBundleSchema>;
export type PromptInsertion = z.infer<typeof PromptInsertionSchema>;
export type PromptAnalysisResponse = z.infer<typeof PromptAnalysisResponseSchema>;

export function promptAnalysisJsonSchema(): Record<string, any> {
  return toCrossProviderToolSchema(z.toJSONSchema(PromptAnalysisResponseSchema));
}

export function joinPromptParts(...parts: string[]): string {
  return parts
    .map(part =>
      part
        .trim()
        .replace(/^,+|,+$/g, '')
        .trim(),
    )
    .filter(Boolean)
    .join(', ')
    .replace(/(?:\s*,\s*){2,}/g, ', ');
}
