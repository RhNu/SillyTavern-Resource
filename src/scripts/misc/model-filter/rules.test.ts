import { describe, expect, it } from 'vitest';
import { ModelFilterRuleSchema, shouldDisplayModel } from './rules';

describe('model filtering', () => {
  it('shows only exact model IDs listed on separate lines', () => {
    const rule = ModelFilterRuleSchema.parse({
      source: 'custom',
      endpoint: 'https://example.test/v1',
      mode: 'include',
      match: 'exact',
      pattern: 'alpha/chat\nbeta/chat',
      ignoreCase: false,
    });
    expect(shouldDisplayModel(rule, 'alpha/chat')).toBe(true);
    expect(shouldDisplayModel(rule, 'alpha/chat-preview')).toBe(false);
    expect(shouldDisplayModel(rule, 'beta/chat')).toBe(true);
  });

  it('excludes model IDs matched by a case-insensitive regex', () => {
    const rule = ModelFilterRuleSchema.parse({
      source: 'openrouter',
      endpoint: '',
      mode: 'exclude',
      match: 'regex',
      pattern: '(?:preview|deprecated)$',
      ignoreCase: true,
    });
    expect(shouldDisplayModel(rule, 'provider/CHAT-PREVIEW')).toBe(false);
    expect(shouldDisplayModel(rule, 'provider/chat')).toBe(true);
  });

  it('rejects an invalid regular expression', () => {
    expect(
      ModelFilterRuleSchema.safeParse({
        source: 'custom',
        endpoint: 'https://example.test/v1',
        mode: 'include',
        match: 'regex',
        pattern: '[',
        ignoreCase: false,
      }).success,
    ).toBe(false);
  });
});
