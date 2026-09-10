const LOG_PREFIX = '[NovelAI Image Helper]';
const MAX_STRING_LENGTH = 2_000;
const MAX_COLLECTION_ENTRIES = 32;
const MAX_SERIALIZE_DEPTH = 4;
const SENSITIVE_KEY = /token|secret|password|authorization|credential|api[-_]?key/i;

export type LogContext = Record<string, unknown>;

function truncate(value: string): string {
  return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
}

function serializeValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return truncate(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'undefined') return undefined;
  if (typeof value === 'function' || typeof value === 'symbol') return String(value);
  if (depth >= MAX_SERIALIZE_DEPTH) return '[深度限制]';

  if (value instanceof Error || (typeof value === 'object' && value !== null && 'message' in value)) {
    const errorLike = value as { name?: unknown; message?: unknown; stack?: unknown; cause?: unknown };
    const details: LogContext = {
      name: typeof errorLike.name === 'string' ? errorLike.name : 'Error',
      message: typeof errorLike.message === 'string' ? truncate(errorLike.message) : String(errorLike.message),
    };
    if (typeof errorLike.stack === 'string') details.stack = truncate(errorLike.stack);
    if ('cause' in errorLike && errorLike.cause !== undefined) {
      details.cause = serializeValue(errorLike.cause, seen, depth + 1);
    }
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (key in details) return;
      details[key] = SENSITIVE_KEY.test(key) ? '[已隐藏]' : serializeValue(item, seen, depth + 1);
    });
    return details;
  }

  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[循环引用]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, MAX_COLLECTION_ENTRIES).map(item => serializeValue(item, seen, depth + 1));
  }

  const record: LogContext = {};
  Object.entries(value as Record<string, unknown>)
    .slice(0, MAX_COLLECTION_ENTRIES)
    .forEach(([key, item]) => {
      record[key] = SENSITIVE_KEY.test(key) ? '[已隐藏]' : serializeValue(item, seen, depth + 1);
    });
  return record;
}

export function serializeError(error: unknown): LogContext {
  const value = serializeValue(error, new WeakSet<object>(), 0);
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as LogContext;
  return { value };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return String(error);
}

type ConsoleMethod = 'debug' | 'info' | 'warn' | 'error';

function write(method: ConsoleMethod, scope: string, message: string, context?: LogContext): void {
  const label = `${LOG_PREFIX} [${scope}]`;
  if (!context || Object.keys(context).length === 0) {
    console[method](label, message);
    return;
  }
  console[method](label, message, serializeValue(context, new WeakSet<object>(), 0));
}

export function createLogger(scope: string) {
  return {
    debug(message: string, context?: LogContext): void {
      write('debug', scope, message, context);
    },
    info(message: string, context?: LogContext): void {
      write('info', scope, message, context);
    },
    warn(message: string, context?: LogContext): void {
      write('warn', scope, message, context);
    },
    error(message: string, error: unknown, context: LogContext = {}): void {
      write('error', scope, message, { ...context, error: serializeError(error) });
    },
  };
}
