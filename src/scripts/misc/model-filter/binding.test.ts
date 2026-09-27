import { describe, expect, it } from 'vitest';
import { normalizeEndpoint, resolveBinding } from './binding';

describe('model filter binding', () => {
  it('uses custom base URLs independently of a connection preset', () => {
    expect(resolveBinding({ chat_completion_source: 'custom', custom_url: 'https://EXAMPLE.test/v1/' })).toEqual({
      source: 'custom',
      endpoint: 'https://example.test/v1',
    });
    expect(resolveBinding({ chat_completion_source: 'custom', custom_url: 'https://other.test/v1' })).toEqual({
      source: 'custom',
      endpoint: 'https://other.test/v1',
    });
  });

  it('uses a reverse proxy for a source that supports one', () => {
    expect(resolveBinding({ chat_completion_source: 'openai', reverse_proxy: 'https://proxy.test/v1/' })).toEqual({
      source: 'openai',
      endpoint: 'https://proxy.test/v1',
    });
    expect(resolveBinding({ chat_completion_source: 'openrouter', reverse_proxy: 'https://proxy.test/v1/' })).toEqual({
      source: 'openrouter',
      endpoint: '',
    });
  });

  it('does not persist credentials or query tokens in the endpoint key', () => {
    expect(normalizeEndpoint('https://user:secret@example.test/v1/?key=secret#fragment')).toBe(
      'https://example.test/v1',
    );
  });

  it('requires a usable URL for custom endpoints', () => {
    expect(resolveBinding({ chat_completion_source: 'custom', custom_url: 'invalid' })).toBeNull();
  });
});
