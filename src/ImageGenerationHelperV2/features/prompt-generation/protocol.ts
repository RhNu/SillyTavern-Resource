import { z } from 'zod';
import { stripXmlComments } from '@/ImageGenerationHelperV2/shared/text';

export const PROMPT_GENERATION_RESPONSE_NAME = 'insert_image_prompts';
export const PROMPT_GENERATION_RESPONSE_VERSION = 1;

export const PromptGenerationInsertionSchema = z
  .object({
    after_paragraph: z.number().int().positive(),
    reasoning: z.string().trim().optional(),
    prompt: z.string().trim().min(1, '生成提示词不能为空'),
  })
  .strict();

export type PromptGenerationInsertion = z.infer<typeof PromptGenerationInsertionSchema>;

export const PromptGenerationResponseSchema = z
  .object({
    name: z.literal(PROMPT_GENERATION_RESPONSE_NAME),
    version: z.literal(PROMPT_GENERATION_RESPONSE_VERSION),
    arguments: z
      .object({
        insertions: z.array(PromptGenerationInsertionSchema).min(1, 'insertions 至少需要 1 个元素'),
      })
      .strict(),
  })
  .strict();

export type PromptGenerationResponse = z.infer<typeof PromptGenerationResponseSchema>;

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return '根对象';
  }

  let formatted = '';
  for (const segment of path) {
    if (typeof segment === 'number') {
      formatted += `[${segment}]`;
      continue;
    }

    formatted += formatted ? `.${String(segment)}` : String(segment);
  }

  return formatted;
}

function formatSchemaError(error: z.ZodError): string {
  return error.issues
    .map(issue => {
      if (issue.code === 'unrecognized_keys') {
        return `${formatIssuePath(issue.path)} 包含未声明字段: ${issue.keys.join(', ')}`;
      }

      return `${formatIssuePath(issue.path)}: ${issue.message}`;
    })
    .join('；');
}

function extractJsonPayload(rawResponse: string): string {
  const cleaned = stripXmlComments(rawResponse).trim();
  if (!cleaned) {
    throw new Error('提示词生成返回为空');
  }

  if (!cleaned.includes('```')) {
    return cleaned;
  }

  const fencedMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (!fencedMatch) {
    throw new Error('提示词生成返回只能是纯 JSON，或单个 ```json 代码块包裹的 JSON');
  }

  return fencedMatch[1]?.trim() ?? '';
}

export function parsePromptGenerationResponse(rawResponse: string): PromptGenerationResponse {
  const payload = extractJsonPayload(rawResponse);
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知 JSON 解析错误';
    throw new Error(`提示词生成返回不是合法 JSON: ${message}`);
  }

  const parsed = PromptGenerationResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`提示词生成返回结构不合法: ${formatSchemaError(parsed.error)}`);
  }

  return parsed.data;
}

export function parsePromptGenerationInsertions(rawResponse: string): PromptGenerationInsertion[] {
  return parsePromptGenerationResponse(rawResponse).arguments.insertions;
}
