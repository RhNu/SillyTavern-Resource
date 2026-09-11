import { z } from 'zod';

export const MODEL_IDS = [
  'nai-diffusion-4-5-full',
  'nai-diffusion-4-5-curated',
  'nai-diffusion-5-full',
  'nai-diffusion-5-curated',
] as const;

export const SAMPLERS = [
  'k_euler',
  'k_euler_ancestral',
  'k_dpm_2',
  'k_dpm_2_ancestral',
  'k_dpmpp_2m',
  'k_dpmpp_2m_sde',
  'k_dpmpp_2s_ancestral',
  'k_dpmpp_sde',
  'ddim',
  'ddim_v3',
] as const;

export const SCHEDULES = ['karras', 'exponential', 'polyexponential'] as const;

const MAX_IMAGE_PIXELS = 3_145_728;
const V45_GRID = [0.1, 0.3, 0.5, 0.7, 0.9] as const;

const PositionSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict();

const CharacterSchema = z
  .object({
    prompt: z.string().trim().min(1).max(50_000),
    uc: z.string().trim().max(50_000),
    position: PositionSchema.optional(),
  })
  .strict();

const StoredOutputSchema = z
  .object({
    mode: z.literal('stored'),
    storage: z
      .object({
        characterName: z.string().optional(),
        filename: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const BinaryOutputSchema = z.object({ mode: z.literal('binary') }).strict();

export const OutputRequestSchema = z.discriminatedUnion('mode', [StoredOutputSchema, BinaryOutputSchema]);

export const GenerateRequestSchema = z
  .object({
    operationId: z.uuid(),
    model: z.enum(MODEL_IDS),
    prompt: z.string().trim().min(1).max(100_000),
    uc: z.string().trim().max(100_000),
    characters: z.array(CharacterSchema).default([]),
    size: z
      .object({
        width: z.number().int().min(64).max(1600).multipleOf(64),
        height: z.number().int().min(64).max(1600).multipleOf(64),
      })
      .strict(),
    sampling: z
      .object({
        steps: z.number().int().min(1).max(50),
        scale: z.number().min(0).max(10),
        sampler: z.enum(SAMPLERS).default('k_euler_ancestral'),
        schedule: z.enum(SCHEDULES).default('karras'),
        seed: z.number().int().min(1).max(9_999_999_999).nullable().optional(),
      })
      .strict(),
    output: OutputRequestSchema,
  })
  .strict()
  .superRefine((request, context) => {
    if (request.size.width * request.size.height > MAX_IMAGE_PIXELS) {
      context.addIssue({
        code: 'custom',
        path: ['size'],
        message: `画布面积不能超过 ${MAX_IMAGE_PIXELS} 像素`,
      });
    }

    const isV5 = request.model.startsWith('nai-diffusion-5');
    const maxCharacters = isV5 ? 22 : 6;
    if (request.characters.length > maxCharacters) {
      context.addIssue({
        code: 'too_big',
        origin: 'array',
        maximum: maxCharacters,
        inclusive: true,
        path: ['characters'],
        message: `${isV5 ? 'V5' : 'V4.5'} 最多支持 ${maxCharacters} 个角色`,
      });
    }

    const positionedCount = request.characters.filter(character => character.position !== undefined).length;
    if (positionedCount !== 0 && positionedCount !== request.characters.length) {
      context.addIssue({
        code: 'custom',
        path: ['characters'],
        message: '使用手动定位时，每个角色都必须提供 position',
      });
    }

    if (!isV5 && positionedCount > 0) {
      request.characters.forEach((character, index) => {
        for (const axis of ['x', 'y'] as const) {
          const value = character.position?.[axis];
          if (value !== undefined && !V45_GRID.some(gridValue => Math.abs(gridValue - value) < 0.000_001)) {
            context.addIssue({
              code: 'custom',
              path: ['characters', index, 'position', axis],
              message: 'V4.5 坐标必须是 0.1、0.3、0.5、0.7 或 0.9',
            });
          }
        }
      });
    }
  });

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const CAPABILITIES = {
  apiVersion: 2,
  configured: false,
  output: {
    count: 1,
    modes: ['stored', 'binary'],
    defaultMode: null,
    formats: ['image/png', 'image/webp'],
  },
  limits: {
    size: { min: 64, max: 1600, multiple: 64, maxPixels: MAX_IMAGE_PIXELS },
    steps: { min: 1, max: 50 },
    scale: { min: 0, max: 10 },
  },
  defaults: {
    size: { width: 832, height: 1216 },
    steps: 23,
    sampler: 'k_euler_ancestral',
    schedule: 'karras',
  },
  models: [
    { id: MODEL_IDS[0], scale: 5, maxCharacters: 6, positioning: 'grid-5x5' },
    { id: MODEL_IDS[1], scale: 5, maxCharacters: 6, positioning: 'grid-5x5' },
    { id: MODEL_IDS[2], scale: 7, maxCharacters: 22, positioning: 'freeform' },
    { id: MODEL_IDS[3], scale: 7, maxCharacters: 22, positioning: 'freeform' },
  ],
} as const;
