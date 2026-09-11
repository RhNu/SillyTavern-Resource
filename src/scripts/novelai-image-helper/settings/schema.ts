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

const ContextCleanupSchema = z.strictObject({
  /** One rule per line in the settings UI. These rules are local to this script. */
  storyRules: z.array(z.string().max(2_000)).max(64).default([]),
  cleanupRules: z.array(z.string().max(2_000)).max(128).default([]),
});

const GenerationPromptPresetSchema = z.strictObject({
  prefix: z.string(),
  suffix: z.string(),
  negative: z.string(),
});

const GenerationPromptPresetCollectionSchema = z
  .strictObject({
    selected: z.string().trim().min(1),
    items: z.record(z.string(), GenerationPromptPresetSchema),
  })
  .superRefine((value, context) => {
    if (!(value.selected in value.items)) {
      context.addIssue({ code: 'custom', path: ['selected'], message: '选中的提示词预设不存在' });
    }
    if (Object.keys(value.items).length === 0) {
      context.addIssue({ code: 'custom', path: ['items'], message: '至少需要保留一个提示词预设' });
    }
  });

export const SettingsSchema = z.strictObject({
  schemaVersion: z.literal(10),
  enabled: z.boolean(),
  notifications: z
    .strictObject({
      /** 仅控制持续更新的进行中 toast；成功与失败通知始终展示。 */
      progressToast: z.boolean().default(true),
    })
    .default({ progressToast: true }),
  analysis: z.strictObject({
    auto: z.boolean(),
    autoGenerate: z.boolean(),
    minimumFloor: z.number().int().nonnegative(),
    historyCount: z.number().int().min(0).max(100),
    debounceMs: z.number().int().min(0).max(60_000),
    connection: z.strictObject({
      providerId: z.string().trim().min(1),
      credentialId: z.string(),
      baseUrl: z.string(),
    }),
    model: z.string(),
    maxTokens: z.number().int().min(256).max(32_000),
    templates: PromptTemplateSchema,
    cleanup: ContextCleanupSchema,
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
    promptPresets: GenerationPromptPresetCollectionSchema,
    /** 覆盖上游生成、解包以及后端存储。 */
    timeoutMs: z.number().int().min(10_000).max(180_000),
    /** 每个阶段的自动重试次数（首次尝试之外）。 */
    retryCount: z.number().int().min(0).max(5),
    /** 任务之间与重试之前的节流基准窗口，实际会在 ±25% 内抖动。 */
    requestIntervalMs: z.number().int().min(0).max(30_000),
  }),
  characters: z.array(CharacterLibraryEntrySchema).max(100),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
export type GenerationPromptPreset = z.infer<typeof GenerationPromptPresetSchema>;
export type CharacterLibraryEntry = z.infer<typeof CharacterLibraryEntrySchema>;
export type CharacterBindings = z.infer<typeof CharacterBindingsSchema>;
export type BindingRef = z.infer<typeof BindingRefSchema>;
export type ContextCleanup = z.infer<typeof ContextCleanupSchema>;

export const DEFAULT_GENERATION_PROMPT_PRESET_NAME = 'NovelAI 默认';

export const DEFAULT_PROMPT_TEMPLATE: PromptTemplate = {
  v45: `You write image prompts for NovelAI Diffusion V4.5, an anime image generator driven by Danbooru tags. Its natural-language comprehension is limited: every prompt body you return is fed to the sampler as-is, so it must stay a compact Danbooru tag string.

Prompt language:
- Lowercase English Danbooru tags separated by commas; underscores_for_spaces inside a tag.
- Never write prose, sentences, explanations, section labels, wrapper tags, quality boilerplate, or pipe separators.
- Use established, concrete tags. Never invent verbose natural-language phrases disguised as tags.
- Copy fixed identity tags from the character guidance exactly. Do not paraphrase, translate, or reorder their spelling.

Work steps (do this inside your own reasoning, never in the prompt fields):
1. Scene intensity: calm conversation, high-intensity action, or intimate/erotic moment.
2. Cast: count everyone visible and fix each character's gender before writing tags.
3. Clothing: did it change since the previous appearance? Undressing, damage, wet, or already nude?
4. Interaction and gaze: what are they doing, and where is each of them looking?
5. Staging: pick the framing, camera angle, lighting, and environment tags that make this single instant readable.

Main prompt order:
1. nsfw first when the story requires it, then rating or content-level tags;
2. explicit character counts: 1girl, 1boy, 1girl 1boy, 2girls;
3. the basic shared action or interaction of this instant;
4. concise composition, framing, and relative placement;
5. the essential environment, camera, and lighting tags only.

Character prompt order:
1. an explicit gender tag first — male, female, otoko_no_ko, or futa;
2. recognizable identity and copyright tags, then stable appearance: hair, eyes, body, species, distinctive features;
3. current clothing, or the explicit undress state taken from the latest story;
4. this character's pose, expression, and physical condition.

Gender isolation:
- Always open a character prompt with its gender tag. Never merge characters into one prompt, and never let one character's gender tags leak into another's.
- 1 girl → female. 1 boy → male. Effeminate male or trap → otoko_no_ko. Futanari → futa.
- Never tag futa or otoko_no_ko characters as female; otherwise anatomy will come out wrong.
- If the character comes from a known work, add their danbooru character tag alongside the gender tag.

Dynamic mode (fights, chases, magic):
- Camera: dynamic_angle, from_below, from_above, dutch_angle, fisheye, foreshortening.
- Effects: motion_blur, depth_of_field, speed_lines, particle_effects, impact_frame.
- Pose: fighting, wielding_sword, punching, kicking, dodging, dynamic_pose, casting_spell.
- Never stage a fight as standing still, and never pair combat with looking_at_viewer.

NSFW mode (intimacy, nudity):
- Put nsfw at the very start of the main prompt, then use act and body tags in the character prompts.
- Keep clothing states in order: fully clothed → teasing, via partially_unbuttoned, clothes_lift, shirt_lift, skirt_lift, shoulder_slip, panties_aside, bra_pull, undressing → half-naked, via topless, bottomless, underwear_only → nude.
- Never jump straight to nude when the story has not gone there yet.
- When clothing comes off, name the exposed anatomy explicitly: nipples, pussy, penis, erection.
- Fluids and traces: sweat, saliva, cum, cum_on_body.
- Acts: sex, vaginal, fellatio, paizuri, cunnilingus, doggystyle, missionary, mating_press.

Tag reference library:
- Counts: 1girl, 1boy, 1girl 1boy, 2girls, multiple_girls, multiple_boys.
- Action: standing, sitting, lying, hugging, holding_hands, looking_at_another, looking_away, kneeling, crouching, leaning.
- Framing: upper_body, cowboy_shot, full_body, wide_shot, close-up, from_side, from_behind, from_above, from_below.
- Face: oval_face, heart_shaped_face, pouty_lips, almond_eyes, hooded_eyes.
- Body: detailed_skin, skin_texture, freckles, scars, tan_lines, heavy_breasts, small_breasts, flat_chest.
- Hands: clenched_fists, open_hands, gripping_object, holding_weapon, hands_on_hips.
- Clothing: inner layer, outer layer, bottomwear, legwear, footwear; wet_clothes, torn_clothes, fabric_physics.
- Effects: volumetric_lighting, god_rays, lens_flare, chromatic_aberration, film_grain, depth_of_field.

Strict rules:
- Format: lowercase, underscores_for_spaces, commas between tags. The main prompt and every character prompt are plain tag strings.
- Keep the main prompt compact: it describes only composition, the basic shared action, and the scene. Do not put character appearance, clothing, anatomy, expression, or other per-character details there.
- Keep each character prompt about that character alone. Do not repeat the main composition, environment, or shared action, and do not repeat details across character prompts.
- Apply the same separation to negatives: main negatives are scene-level only, while each character negative contains only unwanted traits for that character.
- No empty clothing: always give clothing color and type; if nude, say nude explicitly.
- No fourth wall: unless closed_eyes is used, keep the gaze inside the scene with looking_at_another, looking_away, looking_down, or looking_up. Never use looking_at_viewer.
- Danbooru tags apply to the entire canvas. Put only shared material — counts, interaction, environment, camera, lighting — in the main prompt; keep character prompts to per-character identity, appearance, clothing, anatomy, and pose.
- When several characters are present, tag each one only in their own prompt and watch out for cross-contamination of hair color, eye color, and clothing.
- Character guidance is reference material: keep fixed identity facts, but update clothing, damage, emotion, and staging to match the latest story.
- In every positive and negative field, omit quality and rendering-quality terms such as masterpiece, best_quality, worst_quality, low_quality, amazing_quality, or very_aesthetic; generation presets handle them.`,
  v5: `You write concise image prompts for NovelAI Diffusion V5. It understands natural language, including Chinese, but prompt fields must still stay short and direct.

Prompt form:
- Use brief natural-language phrases, compact Danbooru-style tags, or a mixture of both.
- Prefer the shortest wording that preserves the intended composition and character identity. Do not expand a prompt merely because V5 accepts natural language.
- Never output explanations, section labels, wrapper tags, quality boilerplate, or pipe separators.

Main prompt:
- Briefly describe only the composition, framing and relative placement, the basic shared action, and the essential scene or atmosphere.
- Freeze one readable instant. Do not summarize the passage or inventory every visible detail.
- Leave identity, appearance, clothing, anatomy, expression, physical condition, and character-specific poses to the character prompts.

Character prompts:
- One prompt per visible character; never merge two people into one description.
- Describe that character only: name or identity, stable appearance, current clothing or undress state, pose, expression, and physical condition.
- Include a character-specific action only when needed to distinguish their role; do not restate the shared action from the main prompt.
- Do not repeat composition, relative placement, environment, camera instructions, or another character's details. Avoid overlap between all prompt fields.

Positive and negative fields:
- Main negatives contain only unwanted scene-level composition, action, or environment; character negatives contain only unwanted traits for that character.
- Omit quality and rendering-quality terms from every positive and negative field, including masterpiece, best quality, worst quality, low quality, amazing quality, and very aesthetic; generation presets handle them.

NSFW scenes:
- Lead the main prompt with the rating when the scene is explicit, followed by only the basic shared act, setting, and mood.
- Keep each character's state of undress, anatomy, and individual pose in that character's prompt. Use precise wording or act tags without repeating the whole interaction.
- Follow the story's progression and never jump further than it has gone.

Continuity:
- Character guidance is reference material for identity and continuity, never text to copy verbatim.
- When guidance conflicts with the latest story, the story wins: current clothing, transformations, injuries, emotion, and staging are authoritative.
- Reuse earlier wording for the same character, outfit, or scene when the moment is a continuation, so successive images stay consistent.`,
};

export const DEFAULT_GENERATION_PROMPT_PRESET: GenerationPromptPreset = {
  prefix: '',
  suffix: '',
  negative: 'lowres, bad anatomy, bad hands, text, watermark',
};

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 10,
  enabled: true,
  notifications: {
    progressToast: true,
  },
  analysis: {
    auto: false,
    autoGenerate: false,
    minimumFloor: 0,
    historyCount: 8,
    debounceMs: 1_500,
    connection: { providerId: 'openrouter', credentialId: '', baseUrl: '' },
    model: '',
    maxTokens: 4_096,
    templates: DEFAULT_PROMPT_TEMPLATE,
    cleanup: {
      storyRules: [],
      cleanupRules: [],
    },
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
    promptPresets: {
      selected: DEFAULT_GENERATION_PROMPT_PRESET_NAME,
      items: { [DEFAULT_GENERATION_PROMPT_PRESET_NAME]: DEFAULT_GENERATION_PROMPT_PRESET },
    },
    timeoutMs: 130_000,
    retryCount: 2,
    requestIntervalMs: 4_000,
  },
  characters: [],
};

export function normalizeSettings(value: unknown): Settings {
  let candidate = value;
  if (candidate && typeof candidate === 'object' && (candidate as { schemaVersion?: unknown }).schemaVersion === 9) {
    candidate = structuredClone(candidate);
    const legacy = candidate as { schemaVersion: number; generation?: Record<string, unknown> };
    legacy.schemaVersion = 10;
    if (legacy.generation) delete legacy.generation.uploadTimeoutMs;
  }
  const parsed = SettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : structuredClone(DEFAULT_SETTINGS);
}
