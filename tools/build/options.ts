import { cac } from 'cac';
import type { BuildKind, BuildMode, BuildOptions } from './types.ts';

const modes = new Set<BuildMode>(['production', 'development']);
const kinds = new Set<BuildKind>(['scripts', 'plugins']);

const cliName = 'node tools/build.ts';

function createBuildCli() {
  return cac(cliName)
    .usage('[mode] [options]')
    .option('--mode <mode>', 'Set build mode.')
    .option('--kind <kind>', 'Limit project kind. Repeatable.')
    .option('--target <dir>', 'Build a project directory. Repeatable.')
    .option('--watch', 'Watch source directories and rebuild.')
    .option('--verbose', 'Print detailed build logs.')
    .option('--no-cache', 'Disable cache reads and writes.')
    .option('--clear-cache', 'Remove .cache/build before building.')
    .option('-h, --help', 'Show this help text.')
    .example('node tools/build.ts --mode production')
    .example('node tools/build.ts development --kind scripts')
    .example('node tools/build.ts --target scripts/Notifier --target plugins/example')
    .example('node tools/build.ts --watch --mode development');
}

function parseMode(value: string): BuildMode {
  if (!modes.has(value as BuildMode)) throw new Error(`[build] Unsupported mode '${value}'.`);
  return value as BuildMode;
}

function parseKind(value: string): BuildKind {
  if (!kinds.has(value as BuildKind)) throw new Error(`[build] Unsupported kind '${value}'.`);
  return value as BuildKind;
}

function valuesOf(value: unknown): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
}

function validateCli(cli: ReturnType<typeof createBuildCli>, positionalArguments: readonly string[]): void {
  try {
    cli.globalCommand.checkUnknownOptions();
    cli.globalCommand.checkOptionValue();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[build] ${message}.`);
  }

  if (positionalArguments.length > 1) {
    throw new Error(`[build] Unexpected positional argument '${positionalArguments[1]}'.`);
  }
}

export function parseBuildOptions(argv: string[]): BuildOptions {
  const cli = createBuildCli();
  const parsed = cli.parse(['node', cliName, ...argv], { run: false });
  const positionalArguments = [...parsed.args, ...valuesOf(parsed.options['--'])];
  validateCli(cli, positionalArguments);

  const positionalMode = positionalArguments[0];
  if (positionalMode !== undefined && !modes.has(positionalMode as BuildMode)) {
    throw new Error(`[build] Unexpected positional argument '${positionalMode}'.`);
  }

  const mode = parseMode(valuesOf(parsed.options.mode).at(-1) ?? positionalMode ?? 'production');
  const kinds = valuesOf(parsed.options.kind).map(parseKind);
  const targets = valuesOf(parsed.options.target).filter(Boolean);
  const options: BuildOptions = {
    mode,
    kinds: [...new Set(kinds)],
    targets: [...new Set(targets)],
    verbose: parsed.options.verbose === true,
    useCache: parsed.options.cache !== false,
    clearCache: parsed.options.clearCache === true,
    watch: parsed.options.watch === true,
    help: parsed.options.help === true,
  };
  if (options.watch && options.mode === 'production') options.mode = 'development';
  return options;
}

export function printBuildHelp(): void {
  createBuildCli().outputHelp();
}
