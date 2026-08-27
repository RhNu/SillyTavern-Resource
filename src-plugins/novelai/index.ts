/**
 * NovelAI Bridge (Thin)
 *
 * 不使用 nekoai-js 的轻量 NovelAI text2image 后端插件, 仅支持 V4.5 / V5 模型。
 * 请求组装与响应解析参考 novelai-bridge (Apache-2.0) 的 wire 协议:
 * - V4/V4.5/V5 使用 v4_prompt / v4_negative_prompt 结构, 顶层 prompt/uc 省略
 * - V5 特有 params_version=4 与 legacy_uc / tag_hint_transparent_background 字段
 * - V4.5/V5 均不支持 SMEA (sm/sm_dyn) 与 dynamic thresholding, 相关入参被忽略
 * - variety_boost (skip_cfg_above_sigma) 仅 V4.5 支持
 * - native noise schedule 在 V4+ 下强制映射为 karras
 * 响应为原始二进制: 多图为 ZIP 容器 (按扩展名过滤), 单图回退裸字节按 magic bytes 判 MIME。
 */
import { unzipSync } from 'fflate';
import type {
  PluginExit,
  PluginInfo,
  PluginInit,
  PluginRequest,
  PluginResponse,
  PluginRouter,
} from '../@types/sillytavern-plugin';

export const info: PluginInfo = {
  id: 'novelai',
  name: 'NovelAI Bridge (Thin)',
  description:
    '轻量 NovelAI text2image 后端端点 (仅 V4.5 / V5 模型), 不依赖 nekoai-js, 请求协议参考 novelai-bridge。Token 来自环境变量 NOVELAI_TOKEN, 也可在请求体中传入 token 覆盖。',
};

const PLUGIN_VERSION = '1.0.0';

const DEFAULT_TIMEOUT_MS = 120_000;
const NOVELAI_IMAGE_API_URL = 'https://image.novelai.net/ai/generate-image';

/** 本插件支持的模型白名单 (V4.5 / V5) */
const SUPPORTED_MODELS = new Set([
  'nai-diffusion-4-5-full',
  'nai-diffusion-4-5-curated',
  'nai-diffusion-5-full',
  'nai-diffusion-5-curated',
]);

// 上游 NovelAI API 的画布约束 (与 novelai-bridge 的 generate.rs 一致):
// 每边 64~1600 且为 64 的倍数, 总面积 ≤ 3MP, 超出会以 400 Bad Request 拒绝
const MAX_IMAGE_PIXELS = 3_145_728;
const IMAGE_DIMENSION_MIN = 64;
const IMAGE_DIMENSION_MAX = 1600;
const IMAGE_DIMENSION_MULTIPLE = 64;

/** 可透传给 API 的 sampler (与 novelai-bridge 的 Sampler 枚举一致; k_dpm_fast 在 4.5/5 下不存在) */
const SAMPLER_WHITELIST = new Set([
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

/** scheduler → noise_schedule; V4.5/V5 不接受 native, 强制映射为 karras */
const NOISE_SCHEDULE_MAP: Record<string, string> = {
  native: 'karras',
  karras: 'karras',
  exponential: 'exponential',
  polyexponential: 'polyexponential',
};

/** Standard 质量标签, 追加到 v4_prompt.caption.base_caption (与 novelai-bridge QualityPreset::Standard 一致) */
const QUALITY_TAGS = ', very aesthetic, masterpiece, no text';

/** Light ucPreset 文本, 用户未提供负面提示词时作为负向 base_caption */
const UC_PRESET_LIGHT =
  'nsfw, lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page';

/** V4.5 的 variety-boost sigma 系数与参考画布 (novelai-bridge capability.rs) */
const VARIETY_SIGMA_COEFFICIENT = 58.0;
const VARIETY_REFERENCE_PIXELS = 832 * 1216;

type GenerateBody = {
  prompt?: unknown;
  negative_prompt?: unknown;
  model?: unknown;
  sampler?: unknown;
  scheduler?: unknown;
  steps?: unknown;
  scale?: unknown;
  width?: unknown;
  height?: unknown;
  seed?: unknown;
  n_samples?: unknown;
  sm?: unknown;
  sm_dyn?: unknown;
  decrisper?: unknown;
  variety_boost?: unknown;
  upscale_ratio?: unknown;
  token?: unknown;
};

class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/** 单边尺寸规整: clamp 到 [64, 1600] 并四舍五入到 64 的倍数 (novelai-bridge normalize_image_dimension) */
function normalizeImageDimension(value: number): number {
  const clamped = Math.min(Math.max(Math.floor(value), IMAGE_DIMENSION_MIN), IMAGE_DIMENSION_MAX);
  const snapped = Math.round(clamped / IMAGE_DIMENSION_MULTIPLE) * IMAGE_DIMENSION_MULTIPLE;
  return Math.min(Math.max(snapped, IMAGE_DIMENSION_MIN), IMAGE_DIMENSION_MAX);
}

/** 画布面积超限时逐步缩减边长 (每次减 64), 保持 64 倍数网格 (novelai-bridge normalize_canvas_area) */
function normalizeCanvasArea(width: number, height: number): { width: number; height: number } {
  let w = width;
  let h = height;
  while (w * h > MAX_IMAGE_PIXELS) {
    if ((w >= h && w > IMAGE_DIMENSION_MIN) || h === IMAGE_DIMENSION_MIN) {
      w -= IMAGE_DIMENSION_MULTIPLE;
    } else {
      h -= IMAGE_DIMENSION_MULTIPLE;
    }
  }
  return { width: w, height: h };
}

function parseGenerateBody(raw: Record<string, unknown>): GenerateBody {
  const body: GenerateBody = { ...raw };
  const prompt = asString(body.prompt);
  if (!prompt) {
    throw new HttpError(400, '缺少必填参数 prompt');
  }
  body.prompt = prompt;

  const model = asString(body.model);
  if (model && !SUPPORTED_MODELS.has(model)) {
    throw new HttpError(
      400,
      `不支持的模型 "${model}": 本插件仅支持 NovelAI V4.5 / V5 (${[...SUPPORTED_MODELS].join(', ')})`,
    );
  }

  return body;
}

function sendError(res: PluginResponse, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof NovelAiApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
}

class NovelAiApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function resolveToken(bodyToken: unknown): string | undefined {
  const requestToken = asString(bodyToken);
  if (requestToken) {
    return requestToken;
  }

  return asString(process.env.NOVELAI_TOKEN);
}

function defaultSeed(): number {
  const seed = Date.now() % 10_000_000_000;
  return seed === 0 ? 1 : seed;
}

/** 构建 NovelAI text2image wire 请求体 (protocol 参考 novelai-bridge) */
function buildRequestBody(body: GenerateBody, resolvedSeed: number): Record<string, unknown> {
  const prompt = asString(body.prompt) ?? '';
  const model = asString(body.model);
  const isV5 = model?.startsWith('nai-diffusion-5') ?? false;

  const sampler = asString(body.sampler);
  const scheduler = asString(body.scheduler);
  const steps = asFiniteNumber(body.steps);
  const scale = asFiniteNumber(body.scale);
  const width = asFiniteNumber(body.width);
  const height = asFiniteNumber(body.height);
  const nSamples = asFiniteNumber(body.n_samples);
  const varietyBoost = asBoolean(body.variety_boost) ?? false;

  // 尺寸规整: 每边 clamp [64,1600] + 对齐 64 倍数, 总面积 ≤ 3MP (novelai-bridge 同款),
  // 否则上游直接 400 Bad Request
  const rawWidth = width !== undefined && width > 0 ? Math.floor(width) : undefined;
  const rawHeight = height !== undefined && height > 0 ? Math.floor(height) : undefined;
  let resolvedWidth = rawWidth !== undefined ? normalizeImageDimension(rawWidth) : undefined;
  let resolvedHeight = rawHeight !== undefined ? normalizeImageDimension(rawHeight) : undefined;
  if (resolvedWidth !== undefined && resolvedHeight !== undefined) {
    const fitted = normalizeCanvasArea(resolvedWidth, resolvedHeight);
    resolvedWidth = fitted.width;
    resolvedHeight = fitted.height;
  }

  // V4.5/V5 均不支持 SMEA 与 dynamic thresholding → sm/sm_dyn/decrisper 一律不发送
  const negativePrompt = asString(body.negative_prompt) ?? UC_PRESET_LIGHT;

  // variety boost: 仅 V4.5 支持 (skip_cfg_above_sigma = 系数 * sqrt(画布/参考画布)); V5 忽略
  let varietySigma: number | undefined;
  if (!isV5 && varietyBoost && resolvedWidth !== undefined && resolvedHeight !== undefined) {
    const ratio = (resolvedWidth * resolvedHeight) / VARIETY_REFERENCE_PIXELS;
    varietySigma = VARIETY_SIGMA_COEFFICIENT * Math.sqrt(ratio);
  }

  const parameters: Record<string, unknown> = {
    params_version: isV5 ? 4 : 3,
    ...(resolvedWidth !== undefined ? { width: resolvedWidth } : {}),
    ...(resolvedHeight !== undefined ? { height: resolvedHeight } : {}),
    // steps/scale 范围与 novelai-bridge 的 normalize_base_fields 一致 (1~50 / 0~10)
    ...(steps !== undefined && steps >= 1 ? { steps: Math.min(Math.floor(steps), 50) } : {}),
    ...(scale !== undefined && scale >= 0 ? { scale: Math.min(scale, 10) } : {}),
    ...(sampler && SAMPLER_WHITELIST.has(sampler) ? { sampler } : {}),
    seed: resolvedSeed,
    n_samples: nSamples !== undefined && nSamples > 0 ? Math.min(Math.floor(nSamples), 4) : 1,
    negative_prompt: negativePrompt,
    ucPreset: 1,
    qualityToggle: true,
    v4_prompt: {
      caption: {
        base_caption: `${prompt}${QUALITY_TAGS}`,
        char_captions: [],
      },
      use_coords: false,
      use_order: true,
    },
    v4_negative_prompt: {
      caption: {
        base_caption: negativePrompt,
        char_captions: [],
      },
    },
    cfg_rescale: 0,
    noise_schedule: scheduler && NOISE_SCHEDULE_MAP[scheduler] ? NOISE_SCHEDULE_MAP[scheduler] : 'karras',
    characterPrompts: [],
    legacy: false,
    legacy_v3_extend: false,
    deliberate_euler_ancestral_bug: false,
    prefer_brownian: true,
    auto_smea: false,
    add_original_image: true,
    inpaintImg2ImgStrength: 1,
    use_coords: false,
    ...(varietySigma !== undefined ? { skip_cfg_above_sigma: Number(varietySigma.toFixed(6)) } : {}),
    ...(isV5
      ? {
          legacy_uc: false,
          tag_hint_transparent_background: false,
        }
      : {}),
  };

  return {
    action: 'generate',
    input: prompt,
    ...(model ? { model } : {}),
    use_new_shared_trial: true,
    parameters,
  };
}

const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp)$/i;

function mimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

/** 按 magic bytes 推断图片 MIME */
function mimeFromBytes(bytes: Uint8Array): string | undefined {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return undefined;
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
}

/** 从 NovelAI 原始二进制响应中提取图片: 优先 ZIP 容器, 回退为单张裸图 */
function extractImages(payload: Uint8Array): Array<{ data: string; mime: string }> {
  try {
    const archive = unzipSync(payload);
    const entries = Object.entries(archive).filter(([name]) => IMAGE_EXTENSION_PATTERN.test(name));
    if (entries.length > 0) {
      return entries.map(([name, data]) => ({
        data: toBase64(data),
        mime: mimeFromName(name),
      }));
    }
  } catch {
    // 非 ZIP 容器, 回退为单张原始图片
  }

  const mime = mimeFromBytes(payload);
  return [
    {
      data: toBase64(payload),
      mime: mime ?? 'image/png',
    },
  ];
}

async function readErrorText(response: Response): Promise<string> {
  const text = await response.text();
  if (!text.trim()) {
    return `NovelAI API 请求失败 (${response.status})`;
  }
  try {
    const payload = JSON.parse(text) as { message?: unknown };
    const message = asString(payload.message);
    if (message) {
      return message;
    }
  } catch {
    // 非 JSON 响应, 返回原始文本
  }
  return text.trim();
}

async function handleGenerate(req: PluginRequest, res: PluginResponse) {
  try {
    const body = parseGenerateBody(req.body);
    const token = resolveToken(body.token);
    if (!token) {
      res.status(400).json({
        error: '未配置 NovelAI token: 请设置环境变量 NOVELAI_TOKEN, 或在请求体中传入 token',
      });
      return;
    }

    const rawSeed = asFiniteNumber(body.seed);
    const resolvedSeed = rawSeed !== undefined && rawSeed > 0 ? Math.floor(rawSeed) : defaultSeed();
    const requestBody = buildRequestBody(body, resolvedSeed);

    let response: Response;
    try {
      response = await fetch(NOVELAI_IMAGE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch (error) {
      throw new NovelAiApiError(502, `无法连接 NovelAI API: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!response.ok) {
      throw new NovelAiApiError(response.status, await readErrorText(response));
    }

    const payload = new Uint8Array(await response.arrayBuffer());
    const images = extractImages(payload);
    if (images.length === 0) {
      throw new NovelAiApiError(502, 'NovelAI API 返回了无法解析的图片数据');
    }

    res.json({ images });
  } catch (error) {
    sendError(res, error);
  }
}

function handleProbe(_req: PluginRequest, res: PluginResponse) {
  res.json({ ok: true, plugin: info.id, version: PLUGIN_VERSION });
}

export const init: PluginInit = async (router: PluginRouter) => {
  router.get('/probe', handleProbe);
  router.post('/generate', handleGenerate);
};

export const exit: PluginExit = async () => {};
