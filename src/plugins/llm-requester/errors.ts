import { APICallError } from 'ai';
import type { z } from 'zod';
import type { PluginResponse } from '../@types/sillytavern-plugin.js';

export class LlmRequesterError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly issues?: Array<{ path: string; message: string }>,
  ) {
    super(message);
  }
}

export function validationError(error: z.ZodError): LlmRequesterError {
  return new LlmRequesterError(
    400,
    'VALIDATION_ERROR',
    '请求参数无效',
    error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
  );
}

export function normalizeError(error: unknown): LlmRequesterError {
  if (error instanceof LlmRequesterError) return error;
  if (APICallError.isInstance(error)) {
    return new LlmRequesterError(error.statusCode ?? 502, 'UPSTREAM_ERROR', error.message);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new LlmRequesterError(499, 'CLIENT_ABORTED', '客户端已中止请求');
  }
  return new LlmRequesterError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : String(error));
}

export function sendError(response: PluginResponse, requestId: string, error: unknown): void {
  const normalized = normalizeError(error);
  response.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.issues ? { issues: normalized.issues } : {}),
    },
    requestId,
  });
}
