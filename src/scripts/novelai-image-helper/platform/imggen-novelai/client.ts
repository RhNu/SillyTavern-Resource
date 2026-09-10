import { z } from 'zod';
import type { PromptBundle } from '../../domain/prompt';
import { buildGenerateRequest } from '../../image-generation/build-request';
import type { Settings } from '../../settings/schema';
import { createLogger, serializeError } from '../../app/logger';
import { RequestError } from '../request-error';

const BASE_URL = '/api/plugins/imggen-novelai/v1';
const logger = createLogger('platform/imggen-novelai');

const CapabilitiesSchema = z
  .object({
    ok: z.literal(true),
    plugin: z.literal('imggen-novelai'),
    version: z.string(),
    apiVersion: z.literal(1),
    configured: z.boolean(),
    models: z.array(
      z.object({
        id: z.string(),
        scale: z.number(),
        maxCharacters: z.number().int(),
        positioning: z.string(),
      }),
    ),
  })
  .passthrough();

export type Capabilities = z.infer<typeof CapabilitiesSchema>;

export type GeneratedImage = {
  blob: Blob;
  seed: number;
  model: string;
  requestId?: string;
};

function headers(): Record<string, string> {
  return SillyTavern.getRequestHeaders() as Record<string, string>;
}

async function readError(response: Response): Promise<RequestError> {
  const fallback = `图片后端请求失败 (${response.status})`;
  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string; issues?: Array<{ path: string; message: string }> };
      requestId?: string;
    };
    const details = payload.error?.issues?.map(issue => `${issue.path}: ${issue.message}`).join('；');
    const message = [payload.error?.message, details].filter(Boolean).join(' · ') || fallback;
    return new RequestError(message, {
      statusCode: response.status,
      code: payload.error?.code,
      requestId: payload.requestId,
    });
  } catch (error) {
    logger.warn('无法解析图片后端错误响应', {
      statusCode: response.status,
      error: serializeError(error),
    });
    return new RequestError(fallback, { statusCode: response.status });
  }
}

export class NovelAiClient {
  async capabilities(signal?: AbortSignal): Promise<Capabilities> {
    const endpoint = `${BASE_URL}/capabilities`;
    logger.debug('开始请求图片后端能力', { endpoint, aborted: signal?.aborted ?? false });
    try {
      const response = await fetch(endpoint, { headers: headers(), signal });
      if (!response.ok) throw await readError(response);
      const capabilities = CapabilitiesSchema.parse(await response.json());
      logger.info('图片后端能力探测完成', {
        configured: capabilities.configured,
        modelCount: capabilities.models.length,
        version: capabilities.version,
      });
      return capabilities;
    } catch (error) {
      logger.error('图片后端能力探测失败', error, { endpoint });
      throw error;
    }
  }

  async generate(
    bundle: PromptBundle,
    settings: Settings['generation'],
    signal?: AbortSignal,
  ): Promise<GeneratedImage> {
    const endpoint = `${BASE_URL}/generate`;
    logger.debug('开始请求图片生成', {
      endpoint,
      model: settings.model,
      width: settings.width,
      height: settings.height,
      steps: settings.steps,
      characterCount: bundle.characters.length,
      aborted: signal?.aborted ?? false,
    });
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify(buildGenerateRequest(bundle, settings)),
      });
      if (!response.ok) throw await readError(response);
      const contentType = response.headers.get('Content-Type')?.toLowerCase() ?? '';
      if (!contentType.startsWith('image/')) {
        throw new RequestError('图片后端返回了非图片响应', {
          statusCode: response.status,
          code: 'NON_IMAGE_RESPONSE',
        });
      }

      const seed = Number(response.headers.get('X-Imggen-Seed'));
      if (!Number.isSafeInteger(seed) || seed <= 0) {
        throw new RequestError('图片后端没有返回有效 seed', {
          statusCode: response.status,
          code: 'MISSING_SEED',
        });
      }
      const blob = await response.blob();
      const result = {
        blob,
        seed,
        model: response.headers.get('X-Imggen-Model')?.trim() || settings.model,
        requestId: response.headers.get('X-Request-Id')?.trim() || undefined,
      };
      logger.info('图片生成请求完成', {
        requestId: result.requestId,
        seed: result.seed,
        model: result.model,
        contentType,
        size: blob.size,
      });
      return result;
    } catch (error) {
      logger.error('图片生成请求失败', error, {
        endpoint,
        model: settings.model,
        characterCount: bundle.characters.length,
      });
      throw error;
    }
  }
}
