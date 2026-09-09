import type { Logger } from './types.ts';

export function createLogger(verbose: boolean): Logger {
  return {
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => {
      if (verbose) console.info(...args);
    },
  };
}
