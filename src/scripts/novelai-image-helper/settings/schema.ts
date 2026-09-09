import { z } from 'zod';

const ModelSchema = z.enum([
  'nai-diffusion-4-5-full',
  'nai-diffusion-4-5-curated',
  'nai-diffusion-5-full',
  'nai-diffusion-5-curated',
]);

const SamplerSchema = z.enum([
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
]);

const CharacterLibraryEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  negative: z.string().trim(),
  enabled: z.boolean(),
});

export const SettingsSchema = z.strictObject({
  schemaVersion: z.literal(1),
  enabled: z.boolean(),
  analysis: z.strictObject({
    auto: z.boolean(),
    autoGenerate: z.boolean(),
    minimumFloor: z.number().int().nonnegative(),
    minimumParagraphLength: z.number().int().min(1).max(2_000),
    historyCount: z.number().int().min(0).max(100),
    debounceMs: z.number().int().min(0).max(60_000),
    proxyPreset: z.string(),
    apiUrl: z.string(),
    apiKey: z.string(),
    model: z.string(),
    maxTokens: z.number().int().min(256).max(32_000),
    template: z.string().min(1),
  }),
  generation: z.strictObject({
    model: ModelSchema,
    width: z.number().int().min(64).max(1600).multipleOf(64),
    height: z.number().int().min(64).max(1600).multipleOf(64),
    steps: z.number().int().min(1).max(50),
    scale: z.number().min(0).max(10),
    sampler: SamplerSchema,
    schedule: z.enum(['karras', 'exponential', 'polyexponential']),
    seed: z.number().int().min(1).max(9_999_999_999).nullable(),
    prefix: z.string(),
    suffix: z.string(),
    negative: z.string(),
    timeoutMs: z.number().int().min(10_000).max(180_000),
  }),
  characters: z.array(CharacterLibraryEntrySchema).max(100),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type CharacterLibraryEntry = z.infer<typeof CharacterLibraryEntrySchema>;

export const DEFAULT_ANALYSIS_TEMPLATE = `Create NovelAI Danbooru-tag prompts for useful illustrations in the latest story.
Return the main scene prompt separately from every character prompt.
The main prompt describes composition, interaction, environment, camera and lighting.
Each character prompt describes only that character's identity, gender, appearance, clothing and current state.
Use lowercase tags joined by commas. Never join prompt sections with |.
Use character_ref when a character matches the supplied character library.
Do not reveal chain-of-thought; summary must be a short scene-selection explanation.`;

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 1,
  enabled: true,
  analysis: {
    auto: false,
    autoGenerate: false,
    minimumFloor: 0,
    minimumParagraphLength: 40,
    historyCount: 8,
    debounceMs: 1_500,
    proxyPreset: '',
    apiUrl: '',
    apiKey: '',
    model: '',
    maxTokens: 4_096,
    template: DEFAULT_ANALYSIS_TEMPLATE,
  },
  generation: {
    model: 'nai-diffusion-5-curated',
    width: 832,
    height: 1216,
    steps: 23,
    scale: 7,
    sampler: 'k_euler_ancestral',
    schedule: 'karras',
    seed: null,
    prefix: '',
    suffix: '',
    negative: 'lowres, bad anatomy, bad hands, text, watermark',
    timeoutMs: 130_000,
  },
  characters: [],
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function normalizeSettings(value: unknown): Settings {
  const source = record(value);
  return SettingsSchema.parse({
    ...DEFAULT_SETTINGS,
    ...source,
    analysis: { ...DEFAULT_SETTINGS.analysis, ...record(source.analysis) },
    generation: { ...DEFAULT_SETTINGS.generation, ...record(source.generation) },
    characters: Array.isArray(source.characters) ? source.characters : DEFAULT_SETTINGS.characters,
  });
}
