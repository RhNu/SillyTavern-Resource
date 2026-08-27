import type { BindingContext } from '@/ImgGenHelper/adapters/tavern/binding-context-gateway';
import type { NovelAIImageConfig } from '@/ImgGenHelper/config/schema';
import { logInfo } from '@/ImgGenHelper/shared/log';

type UploadedImagePayload = {
  path?: string;
  error?: string;
};

type GenerateNovelImageResult = {
  format: 'png';
  data: string;
};

export type ImageGenerationGateway = ReturnType<typeof createNovelAiImageGateway>;

const NOVELAI_MAX_STEPS = 28;
const NOVELAI_MAX_PIXELS = 1024 * 1024;

function normalizeBase64Image(data: string): string {
  return data.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '').trim();
}

function buildNovelParams(config: NovelAIImageConfig) {
  let steps = Math.min(config.steps, 50);
  let width = config.width;
  let height = config.height;
  let sm = config.sm;
  let smDyn = config.smDyn;
  let varietyBoost = config.varietyBoost;
  const scheduler = ['karras', 'native', 'exponential', 'polyexponential'].includes(config.scheduler)
    ? config.scheduler
    : 'karras';

  // V5 不支持 SMEA 与 variety boost; V4 与 ddim 不支持 SMEA
  const isV5 = config.model === 'nai-diffusion-5-full' || config.model === 'nai-diffusion-5-curated';
  if (isV5 || config.sampler === 'ddim' || ['nai-diffusion-4-curated-preview', 'nai-diffusion-4-full'].includes(config.model)) {
    sm = false;
    smDyn = false;
  }
  if (isV5) {
    varietyBoost = false;
  }

  if (!config.anlasGuard) {
    return { steps, width, height, sm, smDyn, scheduler, varietyBoost };
  }

  if (width * height > NOVELAI_MAX_PIXELS) {
    const ratio = Math.sqrt(NOVELAI_MAX_PIXELS / (width * height));
    let newWidth = Math.round(width * ratio);
    let newHeight = Math.round(height * ratio);

    if (newWidth % 64 !== 0) {
      newWidth -= newWidth % 64;
    }
    if (newHeight % 64 !== 0) {
      newHeight -= newHeight % 64;
    }

    while (newWidth * newHeight > NOVELAI_MAX_PIXELS) {
      if (newWidth > newHeight) {
        newWidth -= 64;
      } else {
        newHeight -= 64;
      }
    }

    logInfo(`Anlas Guard: Image size (${width}x${height}) -> ${newWidth}x${newHeight}`);
    width = Math.max(64, newWidth);
    height = Math.max(64, newHeight);
  }

  if (steps > NOVELAI_MAX_STEPS) {
    logInfo(`Anlas Guard: Steps (${steps}) -> ${NOVELAI_MAX_STEPS}`);
    steps = NOVELAI_MAX_STEPS;
  }

  return { steps, width, height, sm, smDyn, scheduler, varietyBoost };
}

async function readErrorText(response: Response): Promise<string> {
  const text = await response.text();
  return text.trim() || `请求失败 (${response.status})`;
}

const PLUGIN_GENERATE_URL_BY_BACKEND: Record<'plugin-nekojs' | 'plugin-novelai', string> = {
  'plugin-nekojs': '/api/plugins/nekoai/generate',
  'plugin-novelai': '/api/plugins/novelai/generate',
};

type PluginGenerateResponse = {
  images?: Array<{ data?: string; mime?: string }>;
  error?: string;
};

export function createNovelAiImageGateway(options: {
  getImageConfig: () => NovelAIImageConfig;
  getBindingContext: () => BindingContext;
}) {
  const generateNovelImage = async (
    prompt: string,
    negativePrompt: string,
    signal?: AbortSignal,
  ): Promise<GenerateNovelImageResult> => {
    const config = options.getImageConfig();
    const { steps, width, height, sm, smDyn, scheduler, varietyBoost } = buildNovelParams(config);
    const requestBody = {
      prompt,
      model: config.model,
      sampler: config.sampler,
      scheduler,
      steps,
      scale: config.scale,
      width,
      height,
      negative_prompt: negativePrompt,
      upscale_ratio: config.upscaleRatio,
      decrisper: config.decrisper,
      variety_boost: varietyBoost,
      sm,
      sm_dyn: smDyn,
      seed: config.seed >= 0 ? config.seed : undefined,
    };

    if (config.backend === 'plugin-nekojs' || config.backend === 'plugin-novelai') {
      const response = await fetch(PLUGIN_GENERATE_URL_BY_BACKEND[config.backend], {
        method: 'POST',
        headers: SillyTavern.getRequestHeaders(),
        signal,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(await readErrorText(response));
      }

      let payload: PluginGenerateResponse;
      try {
        payload = (await response.json()) as PluginGenerateResponse;
      } catch {
        throw new Error('后端插件返回了无法解析的响应');
      }

      if (!payload.images?.length) {
        throw new Error(payload.error?.trim() || '后端插件未返回图片数据');
      }

      const data = normalizeBase64Image(payload.images[0]?.data ?? '');
      if (!data) {
        throw new Error('后端插件未返回图片数据');
      }

      return {
        format: 'png',
        data,
      };
    }

    const response = await fetch('/api/novelai/generate-image', {
      method: 'POST',
      headers: SillyTavern.getRequestHeaders(),
      signal,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(await readErrorText(response));
    }

    const data = normalizeBase64Image(await response.text());
    if (!data) {
      throw new Error('NovelAI 未返回图片数据');
    }

    return {
      format: 'png',
      data,
    };
  };

  const uploadImage = async (image: GenerateNovelImageResult, signal?: AbortSignal) => {
    const context = options.getBindingContext();
    const characterName = context.character?.label?.trim() ?? '';
    const response = await fetch('/api/images/upload', {
      method: 'POST',
      headers: SillyTavern.getRequestHeaders(),
      signal,
      body: JSON.stringify({
        image: image.data,
        format: image.format,
        ch_name: characterName || undefined,
        filename: `${characterName || 'imggen'}_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      let message = `上传图片失败 (${response.status})`;
      try {
        const payload = (await response.json()) as UploadedImagePayload;
        message = payload.error?.trim() || message;
      } catch {
        message = await readErrorText(response);
      }
      throw new Error(message);
    }

    const payload = (await response.json()) as UploadedImagePayload;
    if (!payload.path?.trim()) {
      throw new Error('图片上传成功但未返回路径');
    }

    return payload.path.trim();
  };

  return {
    async request(prompt: string, negativePrompt: string, signal?: AbortSignal): Promise<string> {
      const generatedImage = await generateNovelImage(prompt, negativePrompt, signal);
      return uploadImage(generatedImage, signal);
    },
  };
}
