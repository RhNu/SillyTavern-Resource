import { randomUUID } from 'node:crypto';
import type { PluginInfo, PluginInit, PluginRequest, PluginResponse } from '../@types/sillytavern-plugin.js';
import {
  LlmGenerateRequestSchema,
  LlmGenerateResponseSchema,
  LlmModelsRequestSchema,
  LlmModelsResponseSchema,
  type LlmConnection,
  type LlmProvider,
} from '@shared/llm-requester/contract.js';
import { generateOpenAiCompatible } from './adapter.ts';
import { describeError, LlmRequesterError, normalizeError, sendError, validationError } from './errors.ts';
import { listOpenAiCompatibleModels } from './models.ts';
import { findProvider, PROVIDERS } from './providers.ts';
import {
  loadSillyTavernRuntime,
  type ResolvedConnection,
  type SillyTavernRuntime,
} from './platform/sillytavern-runtime.ts';

export const info: PluginInfo = {
  id: 'llm-requester',
  name: 'LLM Requester',
  description: '基于 AI SDK 的独立 OpenAI-compatible LLM 请求器。',
};

const PLUGIN_VERSION = '0.2.0';
let runtime: SillyTavernRuntime | undefined;
let runtimeError: string | undefined;

function unavailableRuntime(): never {
  throw new LlmRequesterError(503, 'ST_RUNTIME_UNAVAILABLE', runtimeError ?? 'SillyTavern 运行时不可用');
}

function publicProviders(req: PluginRequest): LlmProvider[] {
  if (runtime) return runtime.providers(req.user.directories);
  return PROVIDERS.map(provider => ({
    id: provider.id,
    label: provider.label,
    baseUrl:
      provider.baseUrl.mode === 'fixed'
        ? { mode: 'fixed' as const }
        : { mode: 'custom' as const, placeholder: provider.baseUrl.placeholder },
    credentialRequired: provider.credentialRequired,
    credentials: [],
  }));
}

function resolveConnection(req: PluginRequest, connection: LlmConnection): ResolvedConnection {
  if (!runtime) return unavailableRuntime();
  const provider = findProvider(connection.providerId);
  if (!provider) throw new LlmRequesterError(400, 'UNKNOWN_PROVIDER', `不支持 Provider: ${connection.providerId}`);

  const publicProvider = runtime.providers(req.user.directories).find(item => item.id === provider.id)!;
  if (provider.credentialRequired && !connection.credentialId) {
    throw new LlmRequesterError(400, 'CREDENTIAL_REQUIRED', `${provider.label} 需要选择凭证`);
  }
  if (connection.credentialId && !publicProvider.credentials.some(item => item.id === connection.credentialId)) {
    throw new LlmRequesterError(400, 'UNKNOWN_CREDENTIAL', `所选 ${provider.label} 凭证不存在`);
  }
  if (provider.baseUrl.mode === 'custom' && !connection.baseUrl) {
    throw new LlmRequesterError(400, 'BASE_URL_REQUIRED', 'Custom Provider 需要 Base URL');
  }
  const resolved = runtime.resolveConnection(
    req.user.directories,
    provider,
    connection.credentialId,
    connection.baseUrl,
  );
  if (provider.credentialRequired && !resolved.apiKey) {
    throw new LlmRequesterError(400, 'CREDENTIAL_EMPTY', `所选 ${provider.label} 凭证为空`);
  }
  return resolved;
}

function createAbortContext(req: PluginRequest) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  req.once('aborted', abort);
  return { signal: controller.signal, dispose: () => req.removeListener('aborted', abort) };
}

function safeBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '(invalid-url)';
  }
}

function handleCapabilities(req: PluginRequest, res: PluginResponse): void {
  res.json({
    ok: true,
    plugin: info.id,
    version: PLUGIN_VERSION,
    apiVersion: 1,
    runtimeCompatible: Boolean(runtime),
    streaming: false,
    tools: true,
    assistantPrefill: true,
    providers: publicProviders(req),
  });
}

async function handleModels(req: PluginRequest, res: PluginResponse): Promise<void> {
  const requestId = randomUUID();
  res.set('X-Request-Id', requestId);
  const abort = createAbortContext(req);
  try {
    const parsed = LlmModelsRequestSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);
    const connection = resolveConnection(req, parsed.data);
    const models = await listOpenAiCompatibleModels(connection, abort.signal);
    res.json(LlmModelsResponseSchema.parse({ requestId, providerId: connection.providerId, models }));
  } catch (error) {
    sendError(res, requestId, error);
  } finally {
    abort.dispose();
  }
}

async function handleGenerate(req: PluginRequest, res: PluginResponse): Promise<void> {
  const requestId = randomUUID();
  res.set('X-Request-Id', requestId);
  const abort = createAbortContext(req);
  const startedAt = Date.now();
  let phase = 'validate';
  let providerId = 'unknown';
  let model = 'unknown';

  console.info(`[llm-requester] request=${requestId} status=received`);

  try {
    const parsed = LlmGenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) throw validationError(parsed.error);

    providerId = parsed.data.provider.providerId;
    model = parsed.data.model;
    phase = 'resolve-connection';
    const connection = resolveConnection(req, parsed.data.provider);

    const messageChars = parsed.data.messages.reduce((total, message) => total + message.content.length, 0);
    const systemMessageCount = parsed.data.messages.filter(message => message.role === 'system').length;
    const toolChoice =
      typeof parsed.data.toolChoice === 'object'
        ? `tool:${parsed.data.toolChoice.name}`
        : (parsed.data.toolChoice ?? 'auto');
    phase = 'upstream-request';
    console.info(
      `[llm-requester] request=${requestId} phase=${phase} provider=${providerId} model=${JSON.stringify(model)} ` +
        `baseUrl=${safeBaseUrl(connection.baseUrl)} messages=${parsed.data.messages.length} ` +
        `systemMessages=${systemMessageCount} messageChars=${messageChars} tools=${parsed.data.tools?.length ?? 0} ` +
        `toolChoice=${toolChoice} timeoutMs=${parsed.data.timeoutMs}`,
    );
    const result = await generateOpenAiCompatible(parsed.data, { ...connection, signal: abort.signal });
    phase = 'response-validation';
    const response = LlmGenerateResponseSchema.parse({ requestId, ...result });
    console.info(
      `[llm-requester] request=${requestId} status=ok provider=${connection.providerId} model=${JSON.stringify(parsed.data.model)} ` +
        `duration=${Date.now() - startedAt}ms finish=${response.finishReason} textChars=${response.text.length} ` +
        `toolCalls=${response.toolCalls.length} warnings=${response.warnings.length}`,
    );
    res.json(response);
  } catch (error) {
    const normalized = normalizeError(error);
    console.warn(
      `[llm-requester] request=${requestId} status=error phase=${phase} provider=${providerId} ` +
        `model=${JSON.stringify(model)} code=${normalized.code} statusCode=${normalized.statusCode} ` +
        `duration=${Date.now() - startedAt}ms`,
      { message: normalized.message, error: describeError(error) },
    );
    sendError(res, requestId, normalized);
  } finally {
    abort.dispose();
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
  router.post('/v1/models', handleModels);
  router.post('/v1/generate', handleGenerate);
};
