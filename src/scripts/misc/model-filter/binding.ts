import type { ModelFilterBinding } from './rules';

type ChatCompletionSettings = {
  chat_completion_source?: unknown;
  custom_url?: unknown;
  azure_base_url?: unknown;
  reverse_proxy?: unknown;
  siliconflow_endpoint?: unknown;
  minimax_endpoint?: unknown;
  zai_endpoint?: unknown;
  workers_ai_account_id?: unknown;
};

const PROXY_SOURCES = new Set([
  'claude',
  'openai',
  'mistralai',
  'makersuite',
  'vertexai',
  'deepseek',
  'xai',
  'zai',
  'moonshot',
]);

function stringSetting(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Keep endpoint identity without persisting credentials or URL query tokens. */
export function normalizeEndpoint(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

/** Resolve the effective endpoint represented by SillyTavern's current source settings. */
export function resolveBinding(settings: ChatCompletionSettings): ModelFilterBinding | null {
  const source = stringSetting(settings.chat_completion_source);
  if (!source) return null;

  if (source === 'custom') {
    const endpoint = normalizeEndpoint(stringSetting(settings.custom_url));
    return endpoint === null ? null : { source, endpoint };
  }
  if (source === 'azure_openai') {
    const endpoint = normalizeEndpoint(stringSetting(settings.azure_base_url));
    return endpoint === null ? null : { source, endpoint };
  }
  if (PROXY_SOURCES.has(source) && stringSetting(settings.reverse_proxy)) {
    const endpoint = normalizeEndpoint(stringSetting(settings.reverse_proxy));
    return endpoint === null ? null : { source, endpoint };
  }

  const endpointSetting: Record<string, unknown> = {
    siliconflow: settings.siliconflow_endpoint,
    minimax: settings.minimax_endpoint,
    zai: settings.zai_endpoint,
    workers_ai: settings.workers_ai_account_id,
  };
  const variant = stringSetting(endpointSetting[source]);
  return { source, endpoint: variant ? `variant:${variant}` : '' };
}

export function readCurrentBinding(): ModelFilterBinding | null {
  const settings = SillyTavern.chatCompletionSettings as ChatCompletionSettings;
  return resolveBinding(settings);
}

/** The selected model may be absent from a filtered select when a preset applies it programmatically. */
export function readSelectedModelId(source: string): string {
  const settings = SillyTavern.chatCompletionSettings as Record<string, unknown>;
  const key = source === 'makersuite' ? 'google_model' : `${source}_model`;
  return stringSetting(settings[key]);
}
