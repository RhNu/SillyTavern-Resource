const SUPPORTED_MODES = new Set(['production', 'development']);

const HELP_TEXT = `
Usage:
  node scripts/build.mjs [mode]
  node scripts/build.mjs [options]

Options:
  --mode <production|development>  Set build mode.
  --target <dir>                   Build a specific src project directory. Repeatable.
  --verbose                        Print detailed build logs.
  --no-cache                       Disable cache reads and writes for this run.
  --clear-cache                    Remove .cache/build before building.
  --help                           Show this help text.

Examples:
  node scripts/build.mjs --mode production
  node scripts/build.mjs development
  node scripts/build.mjs --target PresetController --target Notifier --verbose
  node scripts/build.mjs --clear-cache
`.trim();

/**
 * @param {string | undefined} value
 * @param {string} option
 */
function requireOptionValue(value, option) {
  if (!value || value.startsWith('--')) {
    throw new Error(`[build] Missing value for '${option}'. Use --help to view usage.`);
  }

  return value;
}

/**
 * @param {string} value
 */
function parseModeValue(value) {
  if (!SUPPORTED_MODES.has(value)) {
    throw new Error(`[build] Unsupported mode '${value}'. Use 'production' or 'development'.`);
  }

  return value;
}

/**
 * @param {string[]} argv
 */
export function parseBuildOptions(argv) {
  /** @type {{ mode: 'production' | 'development'; targets: string[]; verbose: boolean; useCache: boolean; clearCache: boolean; help: boolean; }} */
  const options = {
    mode: 'production',
    targets: [],
    verbose: false,
    useCache: true,
    clearCache: false,
    help: false,
  };

  let positionalModeConsumed = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (argument === '--verbose') {
      options.verbose = true;
      continue;
    }

    if (argument === '--no-cache') {
      options.useCache = false;
      continue;
    }

    if (argument === '--clear-cache') {
      options.clearCache = true;
      continue;
    }

    if (argument.startsWith('--mode=')) {
      options.mode = parseModeValue(argument.slice('--mode='.length));
      continue;
    }

    if (argument === '--mode') {
      const value = requireOptionValue(argv[index + 1], '--mode');
      options.mode = parseModeValue(value);
      index += 1;
      continue;
    }

    if (argument.startsWith('--target=')) {
      options.targets.push(requireOptionValue(argument.slice('--target='.length), '--target'));
      continue;
    }

    if (argument === '--target') {
      const value = requireOptionValue(argv[index + 1], '--target');
      options.targets.push(value);
      index += 1;
      continue;
    }

    if (argument.startsWith('--')) {
      throw new Error(`[build] Unknown option '${argument}'. Use --help to view usage.`);
    }

    if (!positionalModeConsumed && SUPPORTED_MODES.has(argument)) {
      options.mode = parseModeValue(argument);
      positionalModeConsumed = true;
      continue;
    }

    throw new Error(`[build] Unexpected positional argument '${argument}'. Use --help to view usage.`);
  }

  options.targets = [...new Set(options.targets)];
  return options;
}

export function getBuildHelpText() {
  return HELP_TEXT;
}
