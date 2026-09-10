import { APICallError, RetryError } from 'ai';
import { APIConnectionTimeoutError, APIError, APIUserAbortError } from 'openai';
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

const MAX_LOG_TEXT_LENGTH = 2_000;
const MAX_LOG_STACK_LENGTH = 4_000;

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}…`;
}

function safeUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '(invalid-url)';
  }
}

function safeHeaders(headers: Record<string, string>): Record<string, string> | undefined {
  const filtered = Object.fromEntries(
    Object.entries(headers).filter(([key]) => !/(authorization|cookie|api[-_]?key|token|secret)/i.test(key)),
  );
  return Object.keys(filtered).length > 0 ? filtered : undefined;
}

function errorName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('name' in error)) return undefined;
  const name = (error as { name?: unknown }).name;
  return typeof name === 'string' ? name : undefined;
}

function describeErrorValue(error: unknown, depth: number): Record<string, unknown> {
  if (depth > 2) return { type: 'nested-error' };

  if (error instanceof LlmRequesterError) {
    return {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      ...(error.issues ? { issues: error.issues } : {}),
      ...(error.stack ? { stack: truncate(error.stack, MAX_LOG_STACK_LENGTH) } : {}),
    };
  }

  if (RetryError.isInstance(error)) {
    return {
      name: error.name,
      message: error.message,
      reason: error.reason,
      attempts: error.errors.length,
      errors: error.errors.map(item => describeErrorValue(item, depth + 1)),
      ...(error.stack ? { stack: truncate(error.stack, MAX_LOG_STACK_LENGTH) } : {}),
    };
  }

  if (APICallError.isInstance(error)) {
    return {
      name: error.name,
      message: error.message,
      url: safeUrl(error.url),
      ...(error.statusCode === undefined ? {} : { statusCode: error.statusCode }),
      isRetryable: error.isRetryable,
      ...(error.responseHeaders ? { responseHeaders: safeHeaders(error.responseHeaders) } : {}),
      ...(error.responseBody ? { responseBody: truncate(error.responseBody, MAX_LOG_TEXT_LENGTH) } : {}),
      ...(error.cause ? { cause: describeErrorValue(error.cause, depth + 1) } : {}),
      ...(error.stack ? { stack: truncate(error.stack, MAX_LOG_STACK_LENGTH) } : {}),
    };
  }

  if (error instanceof APIError) {
    const value = error as APIError & { cause?: unknown };
    return {
      name: error.name,
      message: error.message,
      ...(error.status === undefined ? {} : { statusCode: error.status }),
      ...(error.code ? { code: error.code } : {}),
      ...(error.type ? { type: error.type } : {}),
      ...(error.requestID ? { requestId: error.requestID } : {}),
      ...(value.cause ? { cause: describeErrorValue(value.cause, depth + 1) } : {}),
      ...(error.stack ? { stack: truncate(error.stack, MAX_LOG_STACK_LENGTH) } : {}),
    };
  }

  if (error instanceof Error) {
    const value = error as Error & { cause?: unknown; code?: unknown };
    return {
      name: error.name,
      message: error.message,
      ...(typeof value.code === 'string' ? { code: value.code } : {}),
      ...(value.cause ? { cause: describeErrorValue(value.cause, depth + 1) } : {}),
      ...(error.stack ? { stack: truncate(error.stack, MAX_LOG_STACK_LENGTH) } : {}),
    };
  }

  return { name: errorName(error) ?? typeof error, message: String(error) };
}

/** Return diagnostics safe to write to the server log without logging prompt or credential values. */
export function describeError(error: unknown): Record<string, unknown> {
  return describeErrorValue(error, 0);
}

function isTimeoutError(error: unknown, depth = 0): boolean {
  if (depth > 2 || error == null) return false;
  if (error instanceof APIConnectionTimeoutError) return true;
  if (APICallError.isInstance(error)) {
    return error.statusCode === 408 || isTimeoutError(error.cause, depth + 1);
  }
  if (RetryError.isInstance(error)) return isTimeoutError(error.lastError, depth + 1);
  if (errorName(error) === 'TimeoutError' || errorName(error) === 'APIConnectionTimeoutError') return true;
  if (error instanceof Error) return isTimeoutError(error.cause, depth + 1);
  return false;
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
  if (isTimeoutError(error)) return new LlmRequesterError(504, 'UPSTREAM_TIMEOUT', '上游请求超时');
  if (APICallError.isInstance(error)) {
    return new LlmRequesterError(error.statusCode ?? 502, 'UPSTREAM_ERROR', error.message);
  }
  if (error instanceof APIUserAbortError) {
    return new LlmRequesterError(499, 'CLIENT_ABORTED', '客户端已中止请求');
  }
  if (error instanceof APIError) {
    return new LlmRequesterError(error.status ?? 502, 'UPSTREAM_ERROR', error.message);
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
