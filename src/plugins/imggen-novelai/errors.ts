import type { z } from 'zod';
import type { PluginResponse } from '../@types/sillytavern-plugin.js';

export class PluginError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly issues?: Array<{ path: string; message: string }>;

  constructor(statusCode: number, code: string, message: string, issues?: Array<{ path: string; message: string }>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.issues = issues;
  }
}

export function validationError(error: z.ZodError): PluginError {
  return new PluginError(
    400,
    'VALIDATION_ERROR',
    '请求参数无效',
    error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
  );
}

export function sendError(res: PluginResponse, requestId: string, error: unknown): void {
  const resolved =
    error instanceof PluginError
      ? error
      : new PluginError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : String(error));

  res.status(resolved.statusCode).json({
    error: {
      code: resolved.code,
      message: resolved.message,
      ...(resolved.issues ? { issues: resolved.issues } : {}),
    },
    requestId,
  });
}
