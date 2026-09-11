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
  extractRules: z.array(z.string().max(2_000)).max(64).default([]),
  filterRules: z.array(z.string().max(2_000)).max(128).default([]),
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
  schemaVersion: z.literal(8),
  enabled: z.boolean(),
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
    /** 生成阶段超时；上传阶段由 uploadTimeoutMs 控制。 */
    timeoutMs: z.number().int().min(10_000).max(180_000),
    /** 每个阶段的自动重试次数（首次尝试之外）。 */
    retryCount: z.number().int().min(0).max(5),
    /** 任务之间与重试之前的节流基准窗口，实际会在 ±25% 内抖动。 */
    requestIntervalMs: z.number().int().min(0).max(30_000),
    uploadTimeoutMs: z.number().int().min(5_000).max(120_000),
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
3. interaction and the decisive action of this instant;
4. pose relationship, framing, and gaze direction;
5. environment, time, weather, camera angle, lighting, and visual effects.

Character prompt order:
1. an explicit gender tag first — male, female, otoko_no_ko, or futa;
2. recognizable identity and copyright tags, then stable appearance: hair, eyes, body, species, distinctive features;
3. current clothing, or the explicit undress state taken from the latest story;
4. pose, expression, physical condition, and this character's own part in the action.

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
- No empty clothing: always give clothing color and type; if nude, say nude explicitly.
- No fourth wall: unless closed_eyes is used, keep the gaze inside the scene with looking_at_another, looking_away, looking_down, or looking_up. Never use looking_at_viewer.
- Danbooru tags apply to the entire canvas. Put only shared material — counts, interaction, environment, camera, lighting — in the main prompt; keep character prompts to per-character identity, appearance, clothing, anatomy, and pose.
- When several characters are present, tag each one only in their own prompt and watch out for cross-contamination of hair color, eye color, and clothing.
- Character guidance is reference material: keep fixed identity facts, but update clothing, damage, emotion, and staging to match the latest story.
- Never add generic quality words such as masterpiece, best_quality, amazing_quality, or very_aesthetic; the generation preset already handles that.`,
  v5: `You write image prompts for NovelAI Diffusion V5. Unlike V4.5 it understands full natural language — including Chinese — and reasons about spatial relations and composition, so your job is to direct the shot in words instead of stuffing tags.

Prompt form:
- Write characters, action, relationships, and camera work as natural language, which may contain Chinese.
- Keep Danbooru tags only where they are more precise than a sentence: character counts, a known character or series, specific clothing pieces, or a precise act tag.
- Mixing the two is allowed; mass tag dumping is not — a wall of tags wastes V5's language ability and produces a less coherent picture.
- Never output explanations, section labels, wrapper tags, quality boilerplate, or pipe separators.

Main prompt — write it as a shot list:
- Framing and camera: shot scale, camera height, camera angle, where the lens is aimed, depth of field, and the overall composition.
- Subject placement: where each character sits in the frame, their relative positions, who is in the foreground or background, distance, and facing direction.
- Action beat: freeze the single most decisive instant of the latest story rather than summarizing the whole passage.
- Light and color: light source and direction, time of day, atmosphere, palette, and mood.
- Environment: scene, weather, background detail, and props that carry the story.
- Motion: implied movement, gestures, and any effects that belong to this instant.

Character prompts:
- One prompt per visible character; never merge two people into one description.
- Name the character, then their stable appearance, current clothing or undress state, posture, expression, physical condition, and their own part in the interaction.
- Give concrete, contrastable detail — build, hairstyle and length, eye color, distinctive features — so several characters do not collapse into one look.
- When several characters are present, state who faces whom, who touches whom, and who is in front; keep each of them visually distinct.
- Do not repeat the whole environment or the camera instructions here.

NSFW scenes:
- Lead with the rating when the scene is explicit, then describe the scene in natural language: who does what to whom, the setting, and the mood.
- Describe the state of undress and the acts with precise wording or act tags, keep them in order with the story flow, and never jump further than the story has gone.
- Name exposed anatomy explicitly when it matters.

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
  schemaVersion: 8,
  enabled: true,
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
      extractRules: [],
      filterRules: [],
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
    uploadTimeoutMs: 30_000,
  },
  characters: [],
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function omitKeys(source: UnknownRecord, keys: readonly string[]): UnknownRecord {
  const result = { ...source };
  keys.forEach(key => delete result[key]);
  return result;
}

function readRequiredString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readOptionalString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/** Preserve the selected v2 template and generation prompt fields when adopting the v3 shape. */
function migrateV2Settings(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 2) return value;

  const sourceAnalysis = isRecord(value.analysis) ? value.analysis : {};
  const sourceTemplates = isRecord(sourceAnalysis.templates) ? sourceAnalysis.templates : {};
  const sourceTemplateItems = isRecord(sourceTemplates.items) ? sourceTemplates.items : {};
  const selectedTemplateName = typeof sourceTemplates.selected === 'string' ? sourceTemplates.selected : '';
  const sourceTemplate =
    (isRecord(sourceTemplateItems[selectedTemplateName]) ? sourceTemplateItems[selectedTemplateName] : undefined) ??
    Object.values(sourceTemplateItems).find(isRecord) ??
    {};
  const sourceGeneration = isRecord(value.generation) ? value.generation : {};

  return {
    ...value,
    schemaVersion: 3,
    analysis: {
      ...omitKeys(sourceAnalysis, ['templates']),
      templates: {
        v45: readRequiredString(sourceTemplate.v45, DEFAULT_PROMPT_TEMPLATE.v45),
        v5: readRequiredString(sourceTemplate.v5, DEFAULT_PROMPT_TEMPLATE.v5),
      },
    },
    generation: {
      ...omitKeys(sourceGeneration, ['prefix', 'suffix', 'negative']),
      promptPresets: {
        selected: DEFAULT_GENERATION_PROMPT_PRESET_NAME,
        items: {
          [DEFAULT_GENERATION_PROMPT_PRESET_NAME]: {
            prefix: readOptionalString(sourceGeneration.prefix, DEFAULT_GENERATION_PROMPT_PRESET.prefix),
            suffix: readOptionalString(sourceGeneration.suffix, DEFAULT_GENERATION_PROMPT_PRESET.suffix),
            negative: readOptionalString(sourceGeneration.negative, DEFAULT_GENERATION_PROMPT_PRESET.negative),
          },
        },
      },
    },
  };
}

/** Remove Tavern Helper connection fields while retaining the non-secret endpoint and model settings. */
function migrateV3Settings(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 3) return value;
  const sourceAnalysis = isRecord(value.analysis) ? value.analysis : {};
  return {
    ...value,
    schemaVersion: 4,
    analysis: {
      ...omitKeys(sourceAnalysis, ['proxyPreset', 'apiUrl', 'apiKey']),
      baseUrl: readOptionalString(sourceAnalysis.baseUrl, readOptionalString(sourceAnalysis.apiUrl, '')),
    },
  };
}

/** Replace the fixed Custom connection with an explicit provider and credential selection. */
function migrateV4Settings(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 4) return value;
  const sourceAnalysis = isRecord(value.analysis) ? value.analysis : {};
  const baseUrl = readOptionalString(sourceAnalysis.baseUrl, '');
  return {
    ...value,
    schemaVersion: 5,
    analysis: {
      ...omitKeys(sourceAnalysis, ['baseUrl']),
      connection: {
        providerId: baseUrl.trim() ? 'custom' : 'openrouter',
        credentialId: '',
        baseUrl,
      },
    },
  };
}

/** Add the script-local context cleanup rules without importing any legacy ImgGenHelper settings. */
function migrateV5Settings(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 5) return value;
  const sourceAnalysis = isRecord(value.analysis) ? value.analysis : {};
  const sourceCleanup = isRecord(sourceAnalysis.cleanup) ? sourceAnalysis.cleanup : {};
  return {
    ...value,
    schemaVersion: 6,
    analysis: {
      ...sourceAnalysis,
      cleanup: {
        extractRules: Array.isArray(sourceCleanup.extractRules)
          ? sourceCleanup.extractRules.filter((rule): rule is string => typeof rule === 'string')
          : [],
        filterRules: Array.isArray(sourceCleanup.filterRules)
          ? sourceCleanup.filterRules.filter((rule): rule is string => typeof rule === 'string')
          : [],
      },
    },
  };
}

/** Add the queue throttle/retry controls; v6 retried nothing and paced nothing. */
function migrateV6Settings(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 6) return value;
  const sourceGeneration = isRecord(value.generation) ? value.generation : {};
  return {
    ...value,
    schemaVersion: 7,
    generation: {
      ...sourceGeneration,
      retryCount: DEFAULT_SETTINGS.generation.retryCount,
      requestIntervalMs: DEFAULT_SETTINGS.generation.requestIntervalMs,
      uploadTimeoutMs: DEFAULT_SETTINGS.generation.uploadTimeoutMs,
    },
  };
}

/** Short text is now always retained; the old threshold has no equivalent. */
function migrateV7Settings(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 7) return value;
  return {
    ...value,
    schemaVersion: 8,
    analysis: omitKeys(isRecord(value.analysis) ? value.analysis : {}, ['minimumParagraphLength']),
  };
}

export function legacyAnchorTemplateWarning(settings: Settings): string | undefined {
  return Object.values(settings.analysis.templates).some(text => /after_paragraph|\[P(?:\d+|#)\]/.test(text))
    ? '自定义模板仍引用旧段落协议，请改为使用正文中的 A1、A2 锚点和 anchor_id。模板内容已保留。'
    : undefined;
}

export function normalizeSettings(value: unknown): Settings {
  const parsed = SettingsSchema.safeParse(
    migrateV7Settings(
      migrateV6Settings(migrateV5Settings(migrateV4Settings(migrateV3Settings(migrateV2Settings(value))))),
    ),
  );
  return parsed.success ? parsed.data : structuredClone(DEFAULT_SETTINGS);
}
