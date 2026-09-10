import { randomUUID } from 'node:crypto';
import type { PluginInfo, PluginInit, PluginRequest, PluginResponse } from '../@types/sillytavern-plugin.js';
import { LlmGenerateRequestSchema, LlmGenerateResponseSchema } from '../../../util/llm-requester/contract.js';
import { generateOpenAiCompatible } from './adapter.ts';
import { LlmRequesterError, sendError, validationError } from './errors.ts';
import { loadSillyTavernRuntime, type SillyTavernRuntime } from './platform/sillytavern-runtime.ts';

export const info: PluginInfo = {
  id: 'llm-requester',
  name: 'LLM Requester',
  description: '基于 AI SDK 的独立 OpenAI-compatible LLM 请求器。',
};

const PLUGIN_VERSION = '0.1.0';
let runtime: SillyTavernRuntime | undefined;
let runtimeError: string | undefined;

function customKey(req: PluginRequest): string {
  if (!runtime) throw new LlmRequesterError(503, 'ST_RUNTIME_UNAVAILABLE', runtimeError ?? 'SillyTavern 运行时不可用');
  return runtime.customApiKey(req.user.directories);
}

function handleCapabilities(req: PluginRequest, res: PluginResponse): void {
  const configured = runtime ? Boolean(runtime.customApiKey(req.user.directories)) : false;
  res.json({
    ok: true,
    plugin: info.id,
    version: PLUGIN_VERSION,
    apiVersion: 1,
    runtimeCompatible: Boolean(runtime),
    configured,
    providers: [
      {
        type: 'openai-compatible',
        credential: 'sillytavern-custom',
        streaming: false,
        tools: true,
        assistantPrefill: true,
      },
    ],
  });
}

async function handleGenerate(req: PluginRequest, res: PluginResponse): Promise<void> {
  const requestId = randomUUID();
  res.set('X-Request-Id', requestId);
  const controller = new AbortController();
  const abort = () => controller.abort();
  req.once('aborted', abort);

  try {
    const parsed = LlmGenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);
    if (!runtime)
      throw new LlmRequesterError(503, 'ST_RUNTIME_UNAVAILABLE', runtimeError ?? 'SillyTavern 运行时不可用');
    const apiKey = customKey(req);
    if (!apiKey) throw new LlmRequesterError(503, 'CUSTOM_KEY_NOT_CONFIGURED', 'SillyTavern 尚未配置 Custom API Key');

    const startedAt = Date.now();
    const result = await generateOpenAiCompatible(parsed.data, {
      apiKey,
      headers: runtime.requestHeaders(new URL(parsed.data.provider.baseUrl)),
      signal: controller.signal,
    });
    const response = LlmGenerateResponseSchema.parse({ requestId, ...result });
    console.info(
      `[llm-requester] request=${requestId} model=${parsed.data.model} duration=${Date.now() - startedAt}ms finish=${response.finishReason}`,
    );
    res.json(response);
  } catch (error) {
    console.warn(
      `[llm-requester] request=${requestId} status=error code=${error instanceof LlmRequesterError ? error.code : 'REQUEST_FAILED'}`,
    );
    sendError(res, requestId, error);
  } finally {
    req.removeListener('aborted', abort);
  }
}

export const init: PluginInit = async router => {
  try {
    runtime = await loadSillyTavernRuntime();
  } catch (error) {
    runtimeError = error instanceof Error ? error.message : String(error);
    console.error(`[llm-requester] SillyTavern runtime bridge unavailable: ${runtimeError}`);
  }
  router.get('/v1/capabilities', handleCapabilities);
  router.post('/v1/generate', handleGenerate);
};
