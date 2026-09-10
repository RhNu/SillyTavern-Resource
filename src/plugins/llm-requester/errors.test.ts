import { APICallError } from 'ai';
import { describe, expect, test } from 'vitest';
import { describeError, normalizeError } from './errors.ts';

describe('llm-requester errors', () => {
  test('normalizes the AI SDK timeout signal as an upstream timeout', () => {
    const normalized = normalizeError(new DOMException('request timed out', 'TimeoutError'));

    expect(normalized).toMatchObject({ statusCode: 504, code: 'UPSTREAM_TIMEOUT' });
  });

  test('logs useful upstream diagnostics without request body or credentials', () => {
    const error = new APICallError({
      message: 'Bad gateway',
      url: 'https://user:secret@example.test/v1/chat/completions?token=secret',
      requestBodyValues: { messages: [{ role: 'user', content: 'private prompt' }] },
      statusCode: 502,
      responseHeaders: { authorization: 'secret', 'x-api-key': 'secret', 'x-request-id': 'upstream-request' },
      responseBody: '{"error":"bad gateway"}',
    });

    const details = describeError(error);

    expect(details).toMatchObject({
      url: 'https://example.test/v1/chat/completions',
      statusCode: 502,
      responseBody: '{"error":"bad gateway"}',
      responseHeaders: { 'x-request-id': 'upstream-request' },
    });
    expect(details).not.toHaveProperty('requestBodyValues');
    expect(JSON.stringify(details)).not.toContain('private prompt');
    expect(JSON.stringify(details)).not.toContain('secret');
  });
});
