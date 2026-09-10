import { z } from 'zod';
import type { PromptBundle } from '../../domain/prompt';
import { buildGenerateRequest } from '../../image-generation/build-request';
import type { Settings } from '../../settings/schema';
import { RequestError } from '../request-error';

const BASE_URL = '/api/plugins/imggen-novelai/v1';

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
  } catch {
    return new RequestError(fallback, { statusCode: response.status });
  }
}

export class NovelAiClient {
  async capabilities(signal?: AbortSignal): Promise<Capabilities> {
    const response = await fetch(`${BASE_URL}/capabilities`, { headers: headers(), signal });
    if (!response.ok) throw await readError(response);
    return CapabilitiesSchema.parse(await response.json());
  }

  async generate(
    bundle: PromptBundle,
    settings: Settings['generation'],
    signal?: AbortSignal,
  ): Promise<GeneratedImage> {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(buildGenerateRequest(bundle, settings)),
    });
    if (!response.ok) throw await readError(response);
    if (!response.headers.get('Content-Type')?.toLowerCase().startsWith('image/')) {
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
