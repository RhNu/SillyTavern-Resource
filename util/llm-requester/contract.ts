import { z } from 'zod';

const JsonObjectSchema = z.record(z.string(), z.json());

export const LlmMessageSchema = z.strictObject({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export const LlmToolSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,64}$/),
  description: z.string().trim().max(4_096).optional(),
  inputSchema: JsonObjectSchema,
  strict: z.boolean().optional(),
});

export const LlmToolChoiceSchema = z.union([
  z.enum(['auto', 'none', 'required']),
  z.strictObject({ type: z.literal('tool'), name: z.string().trim().min(1) }),
]);

export const LlmGenerateRequestSchema = z
  .strictObject({
    provider: z.strictObject({
      type: z.literal('openai-compatible'),
      baseUrl: z.url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol), '仅支持 HTTP(S) URL'),
    }),
    model: z.string().trim().min(1).max(512),
    messages: z.array(LlmMessageSchema).min(1).max(512),
    tools: z.array(LlmToolSchema).max(128).optional(),
    toolChoice: LlmToolChoiceSchema.optional(),
    parameters: z
      .strictObject({
        maxOutputTokens: z.number().int().min(1).max(1_000_000).optional(),
        temperature: z.number().min(0).max(100).optional(),
        topP: z.number().min(0).max(1).optional(),
        topK: z.number().int().min(0).optional(),
        frequencyPenalty: z.number().min(-2).max(2).optional(),
        presencePenalty: z.number().min(-2).max(2).optional(),
        seed: z.number().int().safe().optional(),
        stopSequences: z.array(z.string().max(1_000)).max(16).optional(),
      })
      .optional(),
    providerOptions: z.record(z.string(), JsonObjectSchema).optional(),
    timeoutMs: z.number().int().min(1_000).max(300_000).default(120_000),
  })
  .superRefine((request, context) => {
    const toolChoice = request.toolChoice;
    if (toolChoice && toolChoice !== 'none' && !request.tools?.length) {
      context.addIssue({ code: 'custom', path: ['toolChoice'], message: '使用 toolChoice 时必须提供 tools' });
    }
    if (typeof toolChoice === 'object' && !request.tools?.some(tool => tool.name === toolChoice.name)) {
      context.addIssue({ code: 'custom', path: ['toolChoice', 'name'], message: '指定的工具不在 tools 中' });
    }
  });

export const LlmToolCallSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  input: z.json(),
});

export const LlmUsageSchema = z.strictObject({
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
});

export const LlmGenerateResponseSchema = z.strictObject({
  requestId: z.string(),
  model: z.string(),
  text: z.string(),
  reasoning: z.string().optional(),
  toolCalls: z.array(LlmToolCallSchema),
  finishReason: z.string(),
  usage: LlmUsageSchema.optional(),
  warnings: z.array(z.strictObject({ type: z.string(), message: z.string() })),
  providerMetadata: JsonObjectSchema.optional(),
});

export const LlmCapabilitiesSchema = z.strictObject({
  ok: z.literal(true),
  plugin: z.literal('llm-requester'),
  version: z.string(),
  apiVersion: z.literal(1),
  runtimeCompatible: z.boolean(),
  configured: z.boolean(),
  providers: z.array(
    z.strictObject({
      type: z.literal('openai-compatible'),
      credential: z.literal('sillytavern-custom'),
      streaming: z.literal(false),
      tools: z.literal(true),
      assistantPrefill: z.literal(true),
    }),
  ),
});

export type LlmMessage = z.infer<typeof LlmMessageSchema>;
export type LlmTool = z.infer<typeof LlmToolSchema>;
export type LlmGenerateRequest = z.input<typeof LlmGenerateRequestSchema>;
export type ParsedLlmGenerateRequest = z.output<typeof LlmGenerateRequestSchema>;
export type LlmGenerateResponse = z.infer<typeof LlmGenerateResponseSchema>;
export type LlmCapabilities = z.infer<typeof LlmCapabilitiesSchema>;
