import { z } from 'zod';

export const PromptTextSchema = z.strictObject({
  positive: z.string().trim().min(1).max(100_000),
  negative: z.string().trim().max(100_000),
});

export const CharacterPromptSchema = z.strictObject({
  character_ref: z.string().trim().min(1).nullable(),
  label: z.string().trim().min(1).max(120),
  positive: z.string().trim().min(1).max(50_000),
  negative: z.string().trim().max(50_000),
});

export const PromptBundleSchema = z.strictObject({
  main: PromptTextSchema,
  characters: z.array(CharacterPromptSchema).max(22),
});

export const PromptInsertionSchema = z.strictObject({
  after_paragraph: z.number().int().positive(),
  summary: z.string().trim().max(500),
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

export function parsePromptAnalysisResponse(raw: string): PromptAnalysisResponse {
  if (!raw.trim()) {
    throw new Error('提示词模型返回为空');
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`提示词模型没有返回合法 JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const parsed = PromptAnalysisResponseSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`提示词模型返回结构不合法: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
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
