import OpenAI from 'openai';
import type { LlmModel } from '@shared/llm-requester/contract.js';
import type { ResolvedConnection } from './platform/sillytavern-runtime.ts';

export async function listOpenAiCompatibleModels(
  connection: ResolvedConnection,
  signal: AbortSignal,
): Promise<LlmModel[]> {
  const client = new OpenAI({
    apiKey: connection.apiKey || 'not-required',
    baseURL: connection.baseUrl,
    defaultHeaders: connection.headers,
    maxRetries: 0,
    timeout: 30_000,
  });
  const page = await client.models.list({ signal });
  return page.data
    .filter(model => typeof model.id === 'string' && model.id.trim())
    .map(model => ({ id: model.id, label: model.id }))
    .sort((left, right) => left.label.localeCompare(right.label));
}
