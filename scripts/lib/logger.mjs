/**
 * @param {{ verbose?: boolean }} [options]
 */
export function createLogger(options = {}) {
  const verbose = options.verbose === true;

  return {
    verbose,
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => {
      if (verbose) {
        console.info(...args);
      }
    },
  };
}
