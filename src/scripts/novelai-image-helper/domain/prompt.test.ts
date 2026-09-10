import { describe, expect, it } from 'vitest';
import { promptAnalysisJsonSchema, PromptAnalysisResponseSchema } from './prompt';

describe('PromptAnalysisResponseSchema', () => {
  const response = {
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

  it('emits a schema using the OpenAI and Gemini tool-schema intersection', () => {
    const schema = promptAnalysisJsonSchema();
    const serializedSchema = JSON.stringify(schema);

    expect(schema).toMatchObject({
      type: 'object',
      required: ['insertions'],
      properties: {
        insertions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              after_paragraph: { type: 'integer' },
            },
          },
        },
      },
    });
    expect(serializedSchema).not.toContain('$schema');
    expect(serializedSchema).not.toContain('additionalProperties');
    expect(serializedSchema).not.toContain('exclusiveMinimum');
    expect(serializedSchema).not.toContain('minLength');
    expect(serializedSchema).not.toContain('maxLength');
    expect(serializedSchema).not.toContain('maxItems');
  });
});
