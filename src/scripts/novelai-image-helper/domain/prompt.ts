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
  version: z.literal(2),
  insertions: z.array(PromptInsertionSchema).max(8),
});

export type PromptBundle = z.infer<typeof PromptBundleSchema>;
export type PromptInsertion = z.infer<typeof PromptInsertionSchema>;
export type PromptAnalysisResponse = z.infer<typeof PromptAnalysisResponseSchema>;

export function promptAnalysisJsonSchema(): Record<string, any> {
  return z.toJSONSchema(PromptAnalysisResponseSchema) as Record<string, any>;
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
