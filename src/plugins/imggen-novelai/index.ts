import { randomUUID } from 'node:crypto';
import type {
  PluginExit,
  PluginInfo,
  PluginInit,
  PluginRequest,
  PluginResponse,
  PluginRouter,
} from '../@types/sillytavern-plugin.js';
import { CAPABILITIES, GenerateRequestSchema } from './api.ts';
import { requestNovelAiImage } from './client.ts';
import { PluginError, sendError, validationError } from './errors.ts';
import { decodeNovelAiImage } from './response.ts';
import { buildNovelAiRequest } from './wire.ts';

export const info: PluginInfo = {
  id: 'imggen-novelai',
  name: 'ImgGen NovelAI',
  description: '仅支持 NovelAI V4.5/V5 的严格结构化 text-to-image 后端。',
};

const PLUGIN_VERSION = '1.0.0';

function configuredToken(): string | undefined {
  const token = process.env.NOVELAI_TOKEN?.trim();
  return token || undefined;
}

function handleCapabilities(_req: PluginRequest, res: PluginResponse): void {
  res.json({
    ok: true,
    plugin: info.id,
    version: PLUGIN_VERSION,
    ...CAPABILITIES,
    configured: configuredToken() !== undefined,
  });
}

async function handleGenerate(req: PluginRequest, res: PluginResponse): Promise<void> {
  const requestId = randomUUID();
  res.set('X-Request-Id', requestId);

  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const token = configuredToken();
    if (!token) {
      throw new PluginError(503, 'TOKEN_NOT_CONFIGURED', '服务端未配置 NOVELAI_TOKEN');
    }

    const startedAt = Date.now();
    const built = buildNovelAiRequest(parsed.data);
    const payload = await requestNovelAiImage(token, built.body);
    const image = decodeNovelAiImage(payload);

    console.info(
      `[imggen-novelai] request=${requestId} model=${parsed.data.model} size=${parsed.data.size.width}x${parsed.data.size.height} duration=${Date.now() - startedAt}ms status=ok`,
    );

    res.set('Content-Type', image.mime);
    res.set('Content-Length', String(image.bytes.byteLength));
    res.set('X-Imggen-Model', parsed.data.model);
    res.set('X-Imggen-Seed', String(built.seed));
    res.send(Buffer.from(image.bytes.buffer, image.bytes.byteOffset, image.bytes.byteLength));
  } catch (error) {
    console.warn(
      `[imggen-novelai] request=${requestId} status=error code=${error instanceof PluginError ? error.code : 'INTERNAL_ERROR'}`,
    );
    sendError(res, requestId, error);
  }
}

export const init: PluginInit = async (router: PluginRouter) => {
  router.get('/v1/capabilities', handleCapabilities);
  router.post('/v1/generate', handleGenerate);
};

export const exit: PluginExit = async () => {};
