import {
  type BindingRef,
  type CharacterBindings,
  type PromptCharacter,
} from '@/ImgGenHelper/adapters/tavern/binding-context-gateway';
import {
  BUILTIN_TEMPLATE_NAI_NAME,
  DEFAULT_API_PRESET_NAME,
  DEFAULT_NEGATIVE_PROMPT,
  DEFAULT_PROMPT_PRESET_NAME,
  DEFAULT_RENDER_LATEST_REF_MESSAGES_COUNT,
  createBuiltinTemplateItems,
} from '@/ImgGenHelper/config/defaults';
import { normalizeNamedItems, type NamedItems } from '@/ImgGenHelper/config/named-items';
import { z } from 'zod';

const V45_MODEL_OPTIONS = [
  { value: 'nai-diffusion-4-5-full', text: 'NAI Diffusion Anime V4.5 (Full)' },
  { value: 'nai-diffusion-4-5-curated', text: 'NAI Diffusion Anime V4.5 (Curated)' },
] as const;

const V5_MODEL_OPTIONS = [
  { value: 'nai-diffusion-5-full', text: 'NAI Diffusion Anime V5 (Full)' },
  { value: 'nai-diffusion-5-curated', text: 'NAI Diffusion Anime V5 (Curated)' },
] as const;

/** 旧后端 (酒馆内置 / NekoJS 插件) 可用模型: V4.5 及更早 */
export const LEGACY_MODEL_OPTIONS = [
  ...V45_MODEL_OPTIONS,
  { value: 'nai-diffusion-4-full', text: 'NAI Diffusion Anime V4 (Full)' },
  { value: 'nai-diffusion-4-curated-preview', text: 'NAI Diffusion Anime V4 (Curated)' },
  { value: 'nai-diffusion-3', text: 'NAI Diffusion Anime V3' },
  { value: 'nai-diffusion-2', text: 'NAI Diffusion Anime V2' },
  { value: 'nai-diffusion-furry-3', text: 'NAI Diffusion Furry V3' },
] as const;

/** NovelAI Bridge (Thin) 插件后端可用模型: V4.5 / V5 */
export const NOVELAI_V45_V5_MODEL_OPTIONS = [...V45_MODEL_OPTIONS, ...V5_MODEL_OPTIONS] as const;

/** 全部模型选项 (union, 供 schema 校验与兼容导出) */
export const NOVELAI_MODEL_OPTIONS = [...LEGACY_MODEL_OPTIONS, ...V5_MODEL_OPTIONS] as const;

/** 各生成后端允许的模型列表 */
export const MODEL_OPTIONS_BY_BACKEND: Record<ImageBackend, readonly (typeof NOVELAI_MODEL_OPTIONS)[number][]> = {
  tavern: LEGACY_MODEL_OPTIONS,
  'plugin-nekojs': LEGACY_MODEL_OPTIONS,
  'plugin-novelai': NOVELAI_V45_V5_MODEL_OPTIONS,
};

export const NOVELAI_SAMPLER_OPTIONS = [
  'k_euler_ancestral',
  'k_euler',
  'k_dpmpp_2m',
  'k_dpmpp_sde',
  'k_dpmpp_2s_ancestral',
  'k_dpm_fast',
  'ddim',
] as const;

export const NOVELAI_SCHEDULER_OPTIONS = ['karras', 'native', 'exponential', 'polyexponential'] as const;

export type ImageBackend = 'tavern' | 'plugin-nekojs' | 'plugin-novelai';

export const IMAGE_BACKEND_OPTIONS = [
  { value: 'tavern', text: '酒馆内置 NovelAI API' },
  { value: 'plugin-nekojs', text: '后端插件 (NekoJS Bridge)' },
  { value: 'plugin-novelai', text: '后端插件 (NovelAI Bridge)' },
] as const;

export type PromptPreset = {
  prefix: string;
  suffix: string;
  negative: string;
  injectionMode: 'plain' | 'nai';
};

export type NovelAIImageConfig = {
  backend: ImageBackend;
  model: (typeof NOVELAI_MODEL_OPTIONS)[number]['value'];
  sampler: (typeof NOVELAI_SAMPLER_OPTIONS)[number];
  scheduler: (typeof NOVELAI_SCHEDULER_OPTIONS)[number];
  steps: number;
  scale: number;
  width: number;
  height: number;
  seed: number;
  upscaleRatio: number;
  sm: boolean;
  smDyn: boolean;
  decrisper: boolean;
  varietyBoost: boolean;
  anlasGuard: boolean;
};

export type ApiConfig = {
  apiurl: string;
  key: string;
  model: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
};

export type FloatingMenuPositionPercent = {
  xPercent: number;
  yPercent: number;
};

export type ScriptConfig = {
  enabled: boolean;
  image: NovelAIImageConfig;
  generation: {
    autoSend: boolean;
    intervalSeconds: number;
    retryCount: number;
    retryDelaySeconds: number;
    timeoutEnabled: boolean;
    timeoutSeconds: number;
    sequential: boolean;
    renderLatestRefMessagesEnabled: boolean;
    renderLatestRefMessagesCount: number;
  };
  prompt: {
    templates: NamedItems<string>;
    characters: PromptCharacter[];
    presets: NamedItems<PromptPreset>;
  };
  independentApi: {
    autoRequest: boolean;
    historyCount: number;
    debounceMs: number;
    minFloor: number;
    paragraphMinLength: number;
    retryCount: number;
    retryDelaySeconds: number;
    filterTags: string;
    extractTags: string;
    presets: NamedItems<ApiConfig>;
  };
  ui: {
    floatingMenu: {
      position?: FloatingMenuPositionPercent;
    };
  };
};

const PromptPresetSchema = z
  .object({
    prefix: z.string().default('best quality, masterpiece'),
    suffix: z.string().default(''),
    negative: z.string().default(DEFAULT_NEGATIVE_PROMPT),
    injectionMode: z.enum(['plain', 'nai']).default('plain'),
  })
  .prefault({});

const ApiConfigSchema = z
  .object({
    apiurl: z.string().default('https://api.deepseek.com'),
    key: z.string().default(''),
    model: z.string().default('deepseek-chat'),
    max_tokens: z.number().int().positive().default(8192),
    temperature: z.number().min(0).max(2).default(0.9),
    top_p: z.number().min(0).max(1).default(1),
    frequency_penalty: z.number().min(-2).max(2).default(0),
    presence_penalty: z.number().min(-2).max(2).default(0),
  })
  .prefault({});

const NovelAIImageConfigSchema = z
  .object({
    backend: z.enum(['tavern', 'plugin-nekojs', 'plugin-novelai']).default('tavern'),
    model: z
      .enum(
        NOVELAI_MODEL_OPTIONS.map(option => option.value) as [
          NovelAIImageConfig['model'],
          ...NovelAIImageConfig['model'][],
        ],
      )
      .default('nai-diffusion-4-5-curated'),
    sampler: z
      .enum(NOVELAI_SAMPLER_OPTIONS as unknown as [NovelAIImageConfig['sampler'], ...NovelAIImageConfig['sampler'][]])
      .default('k_euler_ancestral'),
    scheduler: z
      .enum(
        NOVELAI_SCHEDULER_OPTIONS as unknown as [NovelAIImageConfig['scheduler'], ...NovelAIImageConfig['scheduler'][]],
      )
      .default('karras'),
    steps: z.number().int().min(1).max(50).default(28),
    scale: z.number().min(0).max(20).default(7),
    width: z.number().int().min(64).max(2048).default(1024),
    height: z.number().int().min(64).max(2048).default(1024),
    seed: z.number().int().min(-1).default(-1),
    upscaleRatio: z.number().min(1).max(4).default(1),
    sm: z.boolean().default(false),
    smDyn: z.boolean().default(false),
    decrisper: z.boolean().default(false),
    varietyBoost: z.boolean().default(false),
    anlasGuard: z.boolean().default(false),
  })
  .prefault({});

const BindingRefSchema = z
  .object({
    key: z.string().trim().min(1),
    label: z.string().default(''),
  })
  .transform(value => ({
    key: value.key,
    label: value.label.trim() || value.key,
  }));

const CharacterBindingsSchema = z
  .object({
    character: z.union([BindingRefSchema, z.null()]).default(null),
    chat: z.union([BindingRefSchema, z.null()]).default(null),
    persona: z.union([BindingRefSchema, z.null()]).default(null),
  })
  .prefault({});

const PromptCharacterSchema = z
  .object({
    id: z.string().default(''),
    name: z.string().default(''),
    content: z.string().default(''),
    enabled: z.boolean().default(true),
    bindings: CharacterBindingsSchema.default(CharacterBindingsSchema.parse({})),
  })
  .prefault({});

const FloatingMenuPositionPercentSchema = z
  .object({
    xPercent: z.number().min(0).max(100).default(100),
    yPercent: z.number().min(0).max(100).default(50),
  })
  .prefault({});

const ScriptConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    image: NovelAIImageConfigSchema.default(NovelAIImageConfigSchema.parse({})),
    generation: z
      .object({
        autoSend: z.boolean().default(true),
        intervalSeconds: z.number().min(0).max(30).default(1),
        retryCount: z.number().int().min(0).max(10).default(3),
        retryDelaySeconds: z.number().min(0).max(30).default(1),
        timeoutEnabled: z.boolean().default(false),
        timeoutSeconds: z.number().int().min(30).max(600).default(120),
        sequential: z.boolean().default(false),
        renderLatestRefMessagesEnabled: z.boolean().default(false),
        renderLatestRefMessagesCount: z
          .number()
          .int()
          .min(1)
          .max(999)
          .default(DEFAULT_RENDER_LATEST_REF_MESSAGES_COUNT),
      })
      .prefault({}),
    prompt: z
      .object({
        templates: z
          .object({
            selected: z.string().default(BUILTIN_TEMPLATE_NAI_NAME),
            items: z.record(z.string(), z.string()).default({}),
          })
          .prefault({}),
        characters: z.array(PromptCharacterSchema).default([]),
        presets: z
          .object({
            selected: z.string().default(DEFAULT_PROMPT_PRESET_NAME),
            items: z.record(z.string(), PromptPresetSchema).default({}),
          })
          .prefault({}),
      })
      .prefault({}),
    independentApi: z
      .object({
        autoRequest: z.boolean().default(true),
        historyCount: z.number().int().min(1).max(10).default(2),
        debounceMs: z.number().int().min(200).max(10000).default(1000),
        minFloor: z.number().int().min(1).max(999).default(1),
        paragraphMinLength: z.number().int().min(1).max(200).default(30),
        retryCount: z.number().int().min(0).max(10).default(1),
        retryDelaySeconds: z.number().min(0).max(30).default(1),
        filterTags: z.string().default(''),
        extractTags: z.string().default(''),
        presets: z
          .object({
            selected: z.string().default(DEFAULT_API_PRESET_NAME),
            items: z.record(z.string(), ApiConfigSchema).default({}),
          })
          .prefault({}),
      })
      .prefault({}),
    ui: z
      .object({
        floatingMenu: z
          .object({
            position: FloatingMenuPositionPercentSchema,
          })
          .prefault({}),
      })
      .prefault({}),
  })
  .prefault({});

function normalizeImageDimension(value: number): number {
  const rounded = Math.round(value / 64) * 64;
  return Math.min(2048, Math.max(64, rounded || 64));
}

function normalizeImageScale(value: number): number {
  return Math.min(20, Math.max(0, Number(value.toFixed(2))));
}

function normalizeUpscaleRatio(value: number): number {
  return Math.min(4, Math.max(1, Number(value.toFixed(2))));
}

export const DEFAULT_IMAGE_MODEL = 'nai-diffusion-4-5-curated';

export function normalizeNovelAIImageConfig(value: unknown): NovelAIImageConfig {
  // 旧配置迁移: 'plugin' → 'plugin-nekojs'
  const source = isRecord(value) ? value : {};
  const migrated = source.backend === 'plugin' ? { ...source, backend: 'plugin-nekojs' } : source;
  const parsed = NovelAIImageConfigSchema.parse(migrated);

  // model 必须属于当前后端支持的列表, 否则重置为默认模型
  const supportedModels = MODEL_OPTIONS_BY_BACKEND[parsed.backend];
  const model = supportedModels.some(option => option.value === parsed.model) ? parsed.model : DEFAULT_IMAGE_MODEL;

  // V5 不支持 SMEA 与 variety boost
  const isV5 = model === 'nai-diffusion-5-full' || model === 'nai-diffusion-5-curated';
  const sm =
    isV5 || parsed.sampler === 'ddim' || ['nai-diffusion-4-curated-preview', 'nai-diffusion-4-full'].includes(model)
      ? false
      : parsed.sm;

  return {
    ...parsed,
    model,
    steps: Math.min(50, Math.max(1, parsed.steps)),
    scale: normalizeImageScale(parsed.scale),
    width: normalizeImageDimension(parsed.width),
    height: normalizeImageDimension(parsed.height),
    seed: Number.isInteger(parsed.seed) ? parsed.seed : -1,
    upscaleRatio: normalizeUpscaleRatio(parsed.upscaleRatio),
    varietyBoost: isV5 ? false : parsed.varietyBoost,
    sm,
    smDyn: sm ? parsed.smDyn : false,
  };
}

function createDefaultPromptPresetItems(): Record<string, PromptPreset> {
  return {
    [DEFAULT_PROMPT_PRESET_NAME]: PromptPresetSchema.parse({}),
  };
}

function createDefaultApiPresetItems(): Record<string, ApiConfig> {
  return {
    [DEFAULT_API_PRESET_NAME]: ApiConfigSchema.parse({}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBindingRef(value: unknown): BindingRef | null {
  if (!isRecord(value) || typeof value.key !== 'string' || !value.key.trim()) {
    return null;
  }

  return BindingRefSchema.parse(value);
}

function normalizeCharacterBindings(value: unknown): CharacterBindings {
  const source = isRecord(value) ? value : {};
  return CharacterBindingsSchema.parse({
    character: normalizeBindingRef(source.character),
    chat: normalizeBindingRef(source.chat),
    persona: normalizeBindingRef(source.persona),
  });
}

function normalizePromptCharacters(value: unknown): PromptCharacter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(entry => {
    const source = isRecord(entry) ? entry : {};
    const parsed = PromptCharacterSchema.parse({
      ...source,
      content: typeof source.content === 'string' ? source.content : typeof source.tags === 'string' ? source.tags : '',
      bindings: normalizeCharacterBindings(source.bindings),
    });

    return {
      ...parsed,
      id: parsed.id.trim() || crypto.randomUUID(),
      bindings: normalizeCharacterBindings(parsed.bindings),
    };
  });
}

export function normalizeConfig(rawConfig: Record<string, unknown>): ScriptConfig {
  const promptSource = isRecord(rawConfig.prompt) ? rawConfig.prompt : {};
  const config = ScriptConfigSchema.parse({
    ...rawConfig,
    image: normalizeNovelAIImageConfig(rawConfig.image),
    prompt: {
      ...promptSource,
      characters: normalizePromptCharacters(promptSource.characters),
    },
  });

  config.prompt.characters = normalizePromptCharacters(config.prompt.characters);
  config.image = normalizeNovelAIImageConfig(config.image);
  config.prompt.templates = normalizeNamedItems(config.prompt.templates, createBuiltinTemplateItems());
  config.prompt.presets = normalizeNamedItems(config.prompt.presets, createDefaultPromptPresetItems());
  config.independentApi.presets = normalizeNamedItems(config.independentApi.presets, createDefaultApiPresetItems());

  return config;
}

export function createNextConfig(
  current: ScriptConfig,
  value: ScriptConfig | ((current: ScriptConfig) => ScriptConfig),
): ScriptConfig {
  const rawNext = typeof value === 'function' ? value(structuredClone(current)) : value;
  return normalizeConfig(structuredClone(rawNext) as Record<string, unknown>);
}
