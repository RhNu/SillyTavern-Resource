export type LoggerMethod = (...args: unknown[]) => void;

export type Logger = {
  log: LoggerMethod;
  debug: LoggerMethod;
  info: LoggerMethod;
  warn: LoggerMethod;
  error: LoggerMethod;
};

function normalizeLoggerPrefix(prefix: string): string {
  const trimmed = prefix.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed : `[${trimmed}]`;
}

function prependLogPrefix(prefix: string, args: unknown[]): unknown[] {
  if (!prefix) return args;
  if (args.length === 0) return [prefix];

  const [first, ...rest] = args;
  if (typeof first === 'string') return [`${prefix} ${first}`, ...rest];
  if (first === undefined) return [prefix, ...rest];
  return [prefix, ...args];
}

export function createLogger(prefix: string): Logger {
  const normalizedPrefix = normalizeLoggerPrefix(prefix);
  const wrap =
    (method: (...args: unknown[]) => void): LoggerMethod =>
    (...args: unknown[]) => {
      method(...prependLogPrefix(normalizedPrefix, args));
    };

  return {
    log: wrap(console.log.bind(console)),
    debug: wrap(console.debug.bind(console)),
    info: wrap(console.info.bind(console)),
    warn: wrap(console.warn.bind(console)),
    error: wrap(console.error.bind(console)),
  };
}
