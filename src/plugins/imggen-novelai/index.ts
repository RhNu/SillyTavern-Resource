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
import { PluginError, sendError, validationError } from './errors.ts';
import { generateAsset, type GeneratedAsset } from './generation-service.ts';
import { OperationRegistry } from './operation-registry.ts';
import { storeGeneratedImage, type StoredImage } from './storage.ts';

export const info: PluginInfo = {
  id: 'imggen-novelai',
  name: 'ImgGen NovelAI',
  description: '仅支持 NovelAI V4.5/V5 的严格结构化 text-to-image 后端。',
};

const PLUGIN_VERSION = '2.0.0';

type StoredOperationResult = {
  mode: 'stored';
  seed: number;
  model: GeneratedAsset['model'];
  stored: StoredImage;
};
type BinaryOperationResult = GeneratedAsset & { mode: 'binary' };
type OperationResult = StoredOperationResult | BinaryOperationResult;

const generatedOperations = new OperationRegistry<GeneratedAsset>(5 * 60_000, 8);
const completedOperations = new OperationRegistry<OperationResult>();

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
    const fingerprint = JSON.stringify(parsed.data);
    const operationKey = `${req.user.profile.handle}:${parsed.data.operationId}`;
    const result = await completedOperations.run(operationKey, fingerprint, async () => {
      const controller = new AbortController();
      const abort = () => controller.abort(new Error('Client disconnected'));
      req.once('aborted', abort);
      try {
        // Keep a small byte cache so a local storage retry does not spend NovelAI quota twice.
        const generated = await generatedOperations.run(operationKey, fingerprint, () =>
          generateAsset(token, parsed.data, controller.signal),
        );
        if (parsed.data.output.mode === 'binary') return { ...generated, mode: 'binary' };
        const stored = await storeGeneratedImage(req.user.directories, generated.image, parsed.data.output.storage);
        generatedOperations.delete(operationKey);
        return { mode: 'stored', seed: generated.seed, model: generated.model, stored };
      } finally {
        req.removeListener('aborted', abort);
      }
    });

    console.info(
      `[imggen-novelai] request=${requestId} operation=${parsed.data.operationId} model=${parsed.data.model} output=${parsed.data.output.mode} size=${parsed.data.size.width}x${parsed.data.size.height} duration=${Date.now() - startedAt}ms status=ok`,
    );

    if (parsed.data.output.mode === 'stored') {
      if (result.mode !== 'stored') throw new PluginError(500, 'INTERNAL_ERROR', '存储输出模式不匹配');
      res.json({
        requestId,
        operationId: parsed.data.operationId,
        seed: result.seed,
        model: result.model,
        output: result.stored,
      });
      return;
    }

    if (result.mode !== 'binary') throw new PluginError(500, 'INTERNAL_ERROR', '二进制输出模式不匹配');

    res.set('Content-Type', result.image.mime);
    res.set('Content-Length', String(result.image.bytes.byteLength));
    res.set('X-Operation-Id', parsed.data.operationId);
    res.set('X-Imggen-Model', result.model);
    res.set('X-Imggen-Seed', String(result.seed));
    res.send(Buffer.from(result.image.bytes.buffer, result.image.bytes.byteOffset, result.image.bytes.byteLength));
  } catch (error) {
    console.warn(
      `[imggen-novelai] request=${requestId} status=error code=${error instanceof PluginError ? error.code : 'INTERNAL_ERROR'}`,
    );
    sendError(res, requestId, error);
  }
}

export const init: PluginInit = async (router: PluginRouter) => {
  router.get('/v2/capabilities', handleCapabilities);
  router.post('/v2/generate', handleGenerate);
};

export const exit: PluginExit = async () => {};
