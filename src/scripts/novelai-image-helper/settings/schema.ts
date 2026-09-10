import { z } from 'zod';

export const MODEL_IDS = [
  'nai-diffusion-4-5-full',
  'nai-diffusion-4-5-curated',
  'nai-diffusion-5-full',
  'nai-diffusion-5-curated',
] as const;

const ModelSchema = z.enum(MODEL_IDS);
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

const SamplerSchema = z.enum(SAMPLERS);

export const BindingRefSchema = z.strictObject({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

export const CharacterBindingsSchema = z.strictObject({
  character: BindingRefSchema.nullable(),
  chat: BindingRefSchema.nullable(),
  persona: BindingRefSchema.nullable(),
});

const CharacterLibraryEntrySchema = z.strictObject({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  /** Free-form model guidance. It may be prose, tags, or a mixture of both. */
  content: z.string().trim().min(1),
  negative: z.string().trim(),
  enabled: z.boolean(),
  bindings: CharacterBindingsSchema,
});

const PromptTemplateSchema = z.strictObject({
  v45: z.string().trim().min(1),
  v5: z.string().trim().min(1),
});

const PromptTemplateCollectionSchema = z
  .strictObject({
    selected: z.string().trim().min(1),
    items: z.record(z.string(), PromptTemplateSchema),
  })
  .superRefine((value, context) => {
    if (!(value.selected in value.items)) {
      context.addIssue({ code: 'custom', path: ['selected'], message: '选中的提示词模板不存在' });
    }
    if (Object.keys(value.items).length === 0) {
      context.addIssue({ code: 'custom', path: ['items'], message: '至少需要保留一个提示词模板' });
    }
  });

export const SettingsSchema = z.strictObject({
  schemaVersion: z.literal(2),
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
    templates: PromptTemplateCollectionSchema,
  }),
  generation: z.strictObject({
    model: ModelSchema,
    width: z.number().int().min(64).max(1600).multipleOf(64),
    height: z.number().int().min(64).max(1600).multipleOf(64),
    steps: z.number().int().min(1).max(50),
    scale: z.number().min(0).max(10),
    sampler: SamplerSchema,
    schedule: z.enum(SCHEDULES),
    seed: z.number().int().min(1).max(9_999_999_999).nullable(),
    prefix: z.string(),
    suffix: z.string(),
    negative: z.string(),
    timeoutMs: z.number().int().min(10_000).max(180_000),
  }),
  characters: z.array(CharacterLibraryEntrySchema).max(100),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
export type CharacterLibraryEntry = z.infer<typeof CharacterLibraryEntrySchema>;
export type CharacterBindings = z.infer<typeof CharacterBindingsSchema>;
export type BindingRef = z.infer<typeof BindingRefSchema>;

export const DEFAULT_TEMPLATE_NAME = 'NovelAI 官方模型';

export const DEFAULT_PROMPT_TEMPLATE: PromptTemplate = {
  v45: `You create prompts for NovelAI Diffusion V4.5. Its natural-language comprehension is limited, so every generated prompt must be a compact Danbooru tag string.

Prompt language:
- Use lowercase English Danbooru tags separated by commas. Use underscores inside multi-word tags.
- Never write prose, full sentences, explanations, section labels, quality boilerplate, or pipe separators.
- Prefer established, concrete tags. Do not invent verbose natural-language phrases disguised as tags.

Main prompt order:
1. rating or content-level tags when the story requires them;
2. explicit character counts such as 1girl, 1boy, 2girls;
3. interaction and decisive action;
4. composition, framing, pose relationship, and gaze direction;
5. environment, time, weather, camera angle, lighting, and visual effects.

Character prompt order:
1. explicit gender and recognizable identity;
2. stable appearance: hair, eyes, body, species, and distinctive features;
3. current clothing or explicit undress state from the latest story;
4. pose, expression, physical condition, and character-specific action.

Continuity and separation:
- Treat character guidance as reference material. Preserve important identity facts but adapt clothing, damage, emotion, and state to the latest story.
- Put shared interaction, background, camera, and lighting only in the main prompt.
- Give every visible important character a separate character prompt. Do not merge two characters into one prompt.`,
  v5: `You create prompts for NovelAI Diffusion V5. It understands natural language—including Chinese—and nuanced relationships much better than V4.5.

Prompt language:
- Use concise natural-language visual direction, Danbooru tags, or a deliberate mixture. Choose the form that communicates the scene most accurately.
- Chinese is allowed when it is clearer than translated tag fragments.
- Prefer coherent visual descriptions over tag stuffing. Do not output explanations, section labels, or pipe separators.

Main prompt:
- Describe the decisive story moment rather than summarizing the whole passage.
- Establish who is present, what they are doing to or with each other, spatial relationships, composition, environment, camera, lighting, mood, and motion.
- Resolve pronouns and ambiguous actions so the visual relationship is explicit.

Character prompts:
- Give every visible important character a separate prompt.
- Describe identity, stable appearance, current clothing, pose, expression, physical condition, and their part in the interaction.
- Avoid repeating the whole environment or camera instructions in every character prompt.

Continuity:
- Character guidance is inspiration and continuity reference, never text that must be copied verbatim.
- Reconcile guidance with the latest story: current clothing, transformations, injuries, emotion, and staging take precedence where appropriate.`,
};

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 2,
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
    templates: { selected: DEFAULT_TEMPLATE_NAME, items: { [DEFAULT_TEMPLATE_NAME]: DEFAULT_PROMPT_TEMPLATE } },
  },
  generation: {
    model: 'nai-diffusion-5-curated',
    width: 832,
    height: 1216,
    steps: 28,
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

/** Settings v2 is intentionally a clean break: invalid or older data is discarded. */
export function normalizeSettings(value: unknown): Settings {
  const parsed = SettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : structuredClone(DEFAULT_SETTINGS);
}
