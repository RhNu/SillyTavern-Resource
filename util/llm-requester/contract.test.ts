import { describe, expect, test } from 'vitest';
import { LlmGenerateRequestSchema } from './contract';

const validRequest = {
  provider: { type: 'openai-compatible' as const, baseUrl: 'https://example.com/v1' },
  model: 'example-model',
  messages: [
    { role: 'system' as const, content: 'Return a tool call.' },
    { role: 'assistant' as const, content: 'prefix:' },
  ],
  tools: [
    {
      name: 'submit_result',
      inputSchema: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
      strict: true,
    },
  ],
  toolChoice: { type: 'tool' as const, name: 'submit_result' },
};

describe('LLM requester contract', () => {
  test('preserves a final assistant message and applies the default timeout', () => {
    const parsed = LlmGenerateRequestSchema.parse(validRequest);

    expect(parsed.messages.at(-1)).toEqual({ role: 'assistant', content: 'prefix:' });
    expect(parsed.timeoutMs).toBe(120_000);
  });

  test('rejects a named tool choice that is not declared', () => {
    const parsed = LlmGenerateRequestSchema.safeParse({
      ...validRequest,
      toolChoice: { type: 'tool', name: 'missing_tool' },
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0]?.path).toEqual(['toolChoice', 'name']);
  });

  test('rejects non-http provider URLs', () => {
    const parsed = LlmGenerateRequestSchema.safeParse({
      ...validRequest,
      provider: { type: 'openai-compatible', baseUrl: 'file:///tmp/secret' },
    });

    expect(parsed.success).toBe(false);
  });
});
