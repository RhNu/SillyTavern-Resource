import { getCurrentBindingContext } from '../bindings/context';
import { logInfo } from '../core/log';
import { getImageGenerationStore, NOVELAI_SCHEDULER_OPTIONS, type NovelAIImageConfig } from '../core/store';

type UploadedImagePayload = {
  path?: string;
  error?: string;
};

type GenerateNovelImageResult = {
  format: 'png';
  data: string;
};

const NOVELAI_MAX_STEPS = 28;
const NOVELAI_MAX_PIXELS = 1024 * 1024;

function readImageConfig(): NovelAIImageConfig {
  return getImageGenerationStore().getActiveImageConfig();
}

function normalizeBase64Image(data: string): string {
  return data.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '').trim();
}

function buildNovelParams(config: NovelAIImageConfig) {
  let steps = Math.min(config.steps, 50);
  let width = config.width;
  let height = config.height;
  let sm = config.sm;
  let smDyn = config.smDyn;
  const scheduler = NOVELAI_SCHEDULER_OPTIONS.includes(config.scheduler)
    ? config.scheduler
    : ('karras' as NovelAIImageConfig['scheduler']);

  if (config.sampler === 'ddim' || ['nai-diffusion-4-curated-preview', 'nai-diffusion-4-full'].includes(config.model)) {
    sm = false;
    smDyn = false;
  }

  if (!config.anlasGuard) {
    return { steps, width, height, sm, smDyn, scheduler };
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

  return { steps, width, height, sm, smDyn, scheduler };
}

async function readErrorText(response: Response): Promise<string> {
  const text = await response.text();
  return text.trim() || `请求失败 (${response.status})`;
}

async function generateNovelImage(
  prompt: string,
  negativePrompt: string,
  signal?: AbortSignal,
): Promise<GenerateNovelImageResult> {
  const config = readImageConfig();
  const { steps, width, height, sm, smDyn, scheduler } = buildNovelParams(config);
  const response = await fetch('/api/novelai/generate-image', {
    method: 'POST',
    headers: SillyTavern.getRequestHeaders(),
    signal,
    body: JSON.stringify({
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
      variety_boost: config.varietyBoost,
      sm,
      sm_dyn: smDyn,
      seed: config.seed >= 0 ? config.seed : undefined,
    }),
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
}

function resolveImageSaveTarget() {
  const context = getCurrentBindingContext();
  const characterName = context.character?.label?.trim() ?? '';
  return {
    folder: characterName || undefined,
    filename: `${characterName || 'imggen'}_${Date.now()}`,
  };
}

async function uploadImage(image: GenerateNovelImageResult, signal?: AbortSignal): Promise<string> {
  const target = resolveImageSaveTarget();
  const response = await fetch('/api/images/upload', {
    method: 'POST',
    headers: SillyTavern.getRequestHeaders(),
    signal,
    body: JSON.stringify({
      image: image.data,
      format: image.format,
      ch_name: target.folder,
      filename: target.filename,
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
}

export async function requestNovelAIImageGeneration(
  prompt: string,
  negativePrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const generatedImage = await generateNovelImage(prompt, negativePrompt, signal);
  return uploadImage(generatedImage, signal);
}
