import { z } from 'zod';
import { PromptBundleSchema, type PromptBundle } from './prompt';

export const BlockStatusSchema = z.enum(['prepared', 'draft', 'queued', 'generating', 'uploading', 'ready', 'failed']);

/** 生图流水线的阶段；界面运行状态与持久化图片结果分别管理。 */
export const BlockFailureStageSchema = z.enum(['validate', 'generate', 'upload', 'commit', 'associate']);

export const ImageOutputSchema = z.strictObject({
  url: z.string().trim().min(1),
  seed: z.number().int().positive(),
  model: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
});

export type ImageOutput = z.infer<typeof ImageOutputSchema>;

export const ImageBlockSchema = z.strictObject({
  id: z.string().trim().min(1),
  summary: z.string().max(500),
  prompt: PromptBundleSchema,
  status: BlockStatusSchema,
  outputs: z.array(ImageOutputSchema),
  /** An uploaded result awaiting idempotent chat-background registration. */
  pendingAssociation: z.string().trim().min(1).optional(),
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

export function createImageBlock(input: { id: string; summary: string; prompt: PromptBundle }): ImageBlock {
  return {
    id: input.id,
    summary: input.summary,
    prompt: input.prompt,
    status: 'prepared',
    outputs: [],
  };
}
