import { Noise, NovelAI, NovelAIApiError, Sampler, type Image, type Model } from 'nekoai-js';
import type {
  PluginExit,
  PluginInfo,
  PluginInit,
  PluginRequest,
  PluginResponse,
  PluginRouter,
} from '../@types/sillytavern-plugin';

export const info: PluginInfo = {
  id: 'nekoai',
  name: 'NekoAI Bridge',
  description:
    '通过 NekoAI-JS 将 NovelAI text2image 封装为后端 API 端点, 供酒馆前端脚本调用。Token 来自环境变量 NOVELAI_TOKEN, 也可在请求体中传入 token 覆盖。',
};

const DEFAULT_TIMEOUT_MS = 120_000;

/** ImageGenerationHelper 的 sampler 值到 NekoAI-JS Sampler 的映射; 不支持的 sampler 不传 (由 API 使用默认值) */
const SAMPLER_MAP: Record<string, Sampler | undefined> = {
  k_euler: Sampler.EULER,
  k_euler_ancestral: Sampler.EULER_ANC,
  k_dpmpp_2m: Sampler.DPM2M,
  k_dpmpp_sde: Sampler.DPMSDE,
  k_dpmpp_2s_ancestral: Sampler.DPM2S_ANC,
  ddim: Sampler.DDIM,
  k_dpm_fast: undefined,
};

/** ImageGenerationHelper 的 scheduler 值到 NekoAI-JS Noise 的映射 */
const SCHEDULER_MAP: Record<string, Noise> = {
  native: Noise.NATIVE,
  karras: Noise.KARRAS,
  exponential: Noise.EXPONENTIAL,
  polyexponential: Noise.POLYEXPONENTIAL,
};

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
  token?: unknown;
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function parseGenerateBody(raw: Record<string, unknown>): GenerateBody {
  const body: GenerateBody = { ...raw };
  const prompt = asString(body.prompt);
  if (!prompt) {
    throw new HttpError(400, '缺少必填参数 prompt');
  }
  body.prompt = prompt;
  return body;
}

class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function sendError(res: PluginResponse, error: unknown) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof NovelAIApiError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
}

function resolveToken(bodyToken: unknown): string | undefined {
  const requestToken = asString(bodyToken);
  if (requestToken) {
    return requestToken;
  }

  return asString(process.env.NOVELAI_TOKEN);
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

    const client = new NovelAI({ token, timeout: DEFAULT_TIMEOUT_MS });

    const sampler = asString(body.sampler);
    const scheduler = asString(body.scheduler);
    const steps = asFiniteNumber(body.steps);
    const scale = asFiniteNumber(body.scale);
    const width = asFiniteNumber(body.width);
    const height = asFiniteNumber(body.height);
    const seed = asFiniteNumber(body.seed);
    const nSamples = asFiniteNumber(body.n_samples);
    const sm = asBoolean(body.sm);
    const smDyn = asBoolean(body.sm_dyn);

    const metadata: Record<string, unknown> = {
      prompt: body.prompt,
    };

    const negativePrompt = asString(body.negative_prompt);
    if (negativePrompt) {
      metadata.negative_prompt = negativePrompt;
    }

    const model = asString(body.model);
    if (model) {
      metadata.model = model as Model;
    }

    const mappedSampler = sampler ? SAMPLER_MAP[sampler] : undefined;
    if (mappedSampler) {
      metadata.sampler = mappedSampler;
    }

    if (scheduler && SCHEDULER_MAP[scheduler]) {
      metadata.noise_schedule = SCHEDULER_MAP[scheduler];
    }

    if (steps !== undefined && steps > 0) {
      metadata.steps = Math.min(Math.floor(steps), 50);
    }

    if (scale !== undefined && scale >= 0) {
      metadata.scale = scale;
    }

    if (width !== undefined && width > 0) {
      metadata.width = Math.floor(width);
    }

    if (height !== undefined && height > 0) {
      metadata.height = Math.floor(height);
    }

    if (seed !== undefined && seed >= 0) {
      metadata.seed = Math.floor(seed);
    }

    if (nSamples !== undefined && nSamples > 0) {
      metadata.n_samples = Math.min(Math.floor(nSamples), 8);
    }

    if (sm !== undefined) {
      metadata.sm = sm;
    }

    if (smDyn !== undefined) {
      metadata.sm_dyn = smDyn;
    }

    const images = await client.generateImage(metadata);
    res.json({
      images: images.map((image: Image) => ({
        data: image.toBase64(),
        mime: 'image/png',
      })),
    });
  } catch (error) {
    sendError(res, error);
  }
}

function handleProbe(_req: PluginRequest, res: PluginResponse) {
  res.json({ ok: true, plugin: info.id });
}

export const init: PluginInit = async (router: PluginRouter) => {
  router.get('/probe', handleProbe);
  router.post('/generate', handleGenerate);
};

export const exit: PluginExit = async () => {};
