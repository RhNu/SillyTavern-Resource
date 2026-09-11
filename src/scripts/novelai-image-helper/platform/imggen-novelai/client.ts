import { z } from 'zod';
import type { PromptBundle } from '../../domain/prompt';
import { buildGenerateRequest } from '../../image-generation/build-request';
import type { Settings } from '../../settings/schema';
import { createLogger, serializeError } from '../../app/logger';
import { RequestError } from '../request-error';

const BASE_URL = '/api/plugins/imggen-novelai/v2';
const logger = createLogger('platform/imggen-novelai');

const CapabilitiesSchema = z
  .object({
    ok: z.literal(true),
    plugin: z.literal('imggen-novelai'),
    version: z.string(),
    apiVersion: z.literal(2),
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

export type BinaryGeneratedImage = {
  blob: Blob;
  seed: number;
  model: string;
  requestId?: string;
};

export type StoredGeneratedImage = {
  path: string;
  mime: string;
  bytes: number;
  seed: number;
  model: string;
  requestId: string;
  operationId: string;
};

const StoredGenerateResponseSchema = z.strictObject({
  requestId: z.string().trim().min(1),
  operationId: z.uuid(),
  seed: z.number().int().positive(),
  model: z.string().trim().min(1),
  output: z.strictObject({
    mode: z.literal('stored'),
    path: z.string().trim().min(1),
    mime: z.string().regex(/^image\//),
    bytes: z.number().int().nonnegative(),
  }),
});

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

  async generateStored(
    bundle: PromptBundle,
    settings: Settings['generation'],
    operationId: string,
    signal?: AbortSignal,
  ): Promise<StoredGeneratedImage> {
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
        body: JSON.stringify({
          ...buildGenerateRequest(bundle, settings),
          operationId,
          output: {
            mode: 'stored',
            storage: {
              characterName: SillyTavern.name2?.trim() || undefined,
              filename: `novelai_${operationId}`,
            },
          },
        }),
      });
      if (!response.ok) throw await readError(response);
      let raw: unknown;
      try {
        raw = await response.json();
      } catch {
        throw new RequestError('图片后端返回了无效 JSON', {
          statusCode: response.status,
          code: 'INVALID_STORED_RESPONSE',
        });
      }
      const parsed = StoredGenerateResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw new RequestError('图片后端返回了无效的存储描述符', {
          statusCode: response.status,
          code: 'INVALID_STORED_RESPONSE',
        });
      }
      const payload = parsed.data;
      const result = {
        path: payload.output.path,
        mime: payload.output.mime,
        bytes: payload.output.bytes,
        seed: payload.seed,
        model: payload.model,
        requestId: payload.requestId,
        operationId: payload.operationId,
      };
      logger.info('图片生成请求完成', {
        requestId: result.requestId,
        seed: result.seed,
        model: result.model,
        mime: result.mime,
        size: result.bytes,
        path: result.path,
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

  async generateBinary(
    bundle: PromptBundle,
    settings: Settings['generation'],
    operationId: string,
    signal?: AbortSignal,
  ): Promise<BinaryGeneratedImage> {
    const endpoint = `${BASE_URL}/generate`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        ...buildGenerateRequest(bundle, settings),
        operationId,
        output: { mode: 'binary' },
      }),
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
    return {
      blob: await response.blob(),
      seed,
      model: response.headers.get('X-Imggen-Model')?.trim() || settings.model,
      requestId: response.headers.get('X-Request-Id')?.trim() || undefined,
    };
  }
}
