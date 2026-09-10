import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
  generateText,
  jsonSchema,
  tool,
  type JSONValue,
  type ModelMessage,
  type ProviderMetadata,
  type ToolChoice,
  type ToolSet,
} from 'ai';
import type { ParsedLlmGenerateRequest } from '../../../util/llm-requester/contract.js';

export type GenerateContext = {
  providerId: string;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
  signal: AbortSignal;
};

function buildTools(request: ParsedLlmGenerateRequest): ToolSet | undefined {
  if (!request.tools?.length) return undefined;
  return Object.fromEntries(
    request.tools.map(definition => [
      definition.name,
      tool({
        description: definition.description,
        inputSchema: jsonSchema(definition.inputSchema),
        strict: definition.strict,
      }),
    ]),
  );
}

function buildToolChoice(request: ParsedLlmGenerateRequest): ToolChoice<ToolSet> | undefined {
  if (typeof request.toolChoice === 'object') {
    return { type: 'tool', toolName: request.toolChoice.name };
  }
  return request.toolChoice;
}

function warningMessage(warning: unknown): { type: string; message: string } {
  if (!warning || typeof warning !== 'object') return { type: 'unknown', message: String(warning) };
  const value = warning as Record<string, unknown>;
  const type = typeof value.type === 'string' ? value.type : 'unknown';
  const message =
    typeof value.message === 'string'
      ? value.message
      : typeof value.feature === 'string'
        ? `不支持的参数: ${value.feature}`
        : JSON.stringify(value);
  return { type, message };
}

function jsonMetadata(metadata: ProviderMetadata | undefined): Record<string, JSONValue> | undefined {
  return metadata as Record<string, JSONValue> | undefined;
}

export async function generateOpenAiCompatible(request: ParsedLlmGenerateRequest, context: GenerateContext) {
  const providerName = 'llmRequester';
  const provider = createOpenAICompatible({
    name: providerName,
    baseURL: context.baseUrl,
    apiKey: context.apiKey || 'not-required',
    headers: context.headers,
  });
  const parameters = request.parameters ?? {};
  const result = await generateText({
    model: provider(request.model),
    messages: request.messages as ModelMessage[],
    tools: buildTools(request),
    toolChoice: buildToolChoice(request),
    maxOutputTokens: parameters.maxOutputTokens,
    temperature: parameters.temperature,
    topP: parameters.topP,
    topK: parameters.topK,
    frequencyPenalty: parameters.frequencyPenalty,
    presencePenalty: parameters.presencePenalty,
    seed: parameters.seed,
    stopSequences: parameters.stopSequences,
    providerOptions: request.providerOptions,
    abortSignal: context.signal,
    timeout: request.timeoutMs,
  });

  return {
    model: request.model,
    text: result.text,
    ...(result.reasoningText ? { reasoning: result.reasoningText } : {}),
    toolCalls: result.toolCalls.map(call => ({ id: call.toolCallId, name: call.toolName, input: call.input })),
    finishReason: result.finishReason,
    usage: {
      ...(result.usage.inputTokens === undefined ? {} : { inputTokens: result.usage.inputTokens }),
      ...(result.usage.outputTokens === undefined ? {} : { outputTokens: result.usage.outputTokens }),
      ...(result.usage.totalTokens === undefined ? {} : { totalTokens: result.usage.totalTokens }),
    },
    warnings: (result.warnings ?? []).map(warningMessage),
    ...(result.providerMetadata ? { providerMetadata: jsonMetadata(result.providerMetadata) } : {}),
  };
}
