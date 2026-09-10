import { z } from 'zod';
import { PromptBundleSchema, type PromptBundle } from './prompt';

export const BlockStatusSchema = z.enum(['prepared', 'draft', 'queued', 'generating', 'uploading', 'ready', 'failed']);

/** 生图流水线的阶段。`INTERRUPTED` 这类系统级中断不带阶段。 */
export const BlockFailureStageSchema = z.enum(['validate', 'generate', 'upload', 'commit']);

export const ImageOutputSchema = z.strictObject({
  url: z.string().trim().min(1),
  seed: z.number().int().positive(),
  model: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
});

export const ImageBlockSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.string().trim().min(1),
  revision: z.number().int().nonnegative(),
  sourceMessageHash: z.string(),
  summary: z.string(),
  prompt: PromptBundleSchema,
  status: BlockStatusSchema,
  outputs: z.array(ImageOutputSchema),
  error: z
    .strictObject({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
      stage: BlockFailureStageSchema.optional(),
      attempts: z.number().int().positive().optional(),
    })
    .optional(),
});

export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type BlockStatus = z.infer<typeof BlockStatusSchema>;
export type BlockFailureStage = z.infer<typeof BlockFailureStageSchema>;

export function createImageBlock(input: {
  id: string;
  sourceMessageHash: string;
  summary: string;
  prompt: PromptBundle;
}): ImageBlock {
  return {
    schemaVersion: 1,
    id: input.id,
    revision: 0,
    sourceMessageHash: input.sourceMessageHash,
    summary: input.summary,
    prompt: input.prompt,
    status: 'prepared',
    outputs: [],
  };
}

export async function hashText(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}
