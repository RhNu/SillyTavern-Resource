import { describe, expect, it } from 'vitest';
import { PromptAnalysisResponseSchema } from './prompt';

describe('PromptAnalysisResponseSchema', () => {
  const response = {
    version: 2 as const,
    insertions: [
      {
        after_paragraph: 1,
        summary: 'Scene selection',
        prompt: {
          main: { positive: '1girl, outdoors', negative: '' },
          characters: [],
        },
      },
    ],
  };

  it('accepts structured tool input directly', () => {
    expect(PromptAnalysisResponseSchema.parse(response)).toEqual(response);
  });

  it('does not accept a JSON-encoded string as tool input', () => {
    expect(() => PromptAnalysisResponseSchema.parse(JSON.stringify(response))).toThrow();
  });
});
