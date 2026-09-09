import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import chokidar from 'chokidar';
import { buildBrowserProject } from './build/browser.ts';
import {
  cleanupStaleOutputs,
  clearBuildCache,
  emptyManifest,
  fingerprint,
  manifestOutput,
  prepareStaging,
  readManifest,
  syncOutput,
  writeManifest,
} from './build/cache.ts';
import { rootDir } from './build/config.ts';
import {
  assertProjectConstraints,
  discoverProjects,
  inspectProjectOutput,
  removeEmptyDirectories,
  selectProjects,
} from './build/discovery.ts';
import { createLogger } from './build/logger.ts';
import { parseBuildOptions, printBuildHelp } from './build/options.ts';
import { buildPluginProject } from './build/plugin.ts';
import type { BuildContext, BuildOptions, Project } from './build/types.ts';

async function rebuild(project: Project, context: BuildContext): Promise<string[]> {
  prepareStaging(project);
  if (project.kind === 'plugin') await buildPluginProject(project, context);
  else await buildBrowserProject(project, context);
  removeEmptyDirectories(project.stagingOutputDir);
  const staged = inspectProjectOutput(project, project.stagingOutputDir, context.mode);
  if (!staged.valid)
    throw new Error(`[build] Invalid output for '${project.projectKey}': ${staged.files.join(', ') || '(none)'}.`);
  syncOutput(project);
  const final = inspectProjectOutput(project, project.finalOutputDir, context.mode);
  if (!final.valid) throw new Error(`[build] Failed to synchronize output for '${project.projectKey}'.`);
  return final.files;
}

async function runBuild(options: BuildOptions): Promise<void> {
  const logger = createLogger(options.verbose);
  const context: BuildContext = {
    mode: options.mode,
    isProduction: options.mode === 'production',
    verbose: options.verbose,
  };
  if (options.clearCache) clearBuildCache();

  const discovered = discoverProjects();
  const selected = selectProjects(discovered, options.kinds, options.targets);
  const manifest = options.useCache ? readManifest() : emptyManifest();
  logger.info(`[build] mode=${options.mode} selected=${selected.length} cache=${options.useCache ? 'on' : 'off'}`);

  const summary = { built: 0, skipped: 0 };
  for (const project of selected) {
    assertProjectConstraints(project);
    const startedAt = performance.now();
    const { inputHash, inputFiles } = fingerprint(project);
    const cached = manifest.projects[project.projectKey];
    const output = inspectProjectOutput(project, project.finalOutputDir, options.mode);
    if (options.useCache && cached?.mode === options.mode && cached.inputHash === inputHash && output.valid) {
      summary.skipped += 1;
      logger.info(`[build] skip(cache hit) ${project.projectKey}`);
      continue;
    }

    logger.info(`[build] build ${project.projectKey}`);
    const outputFiles = await rebuild(project, context);
    summary.built += 1;
    logger.debug(
      `[build] ${project.projectKey} inputs=${inputFiles.length} duration=${Math.round(performance.now() - startedAt)}ms`,
    );
    if (options.useCache) {
      manifest.projects[project.projectKey] = {
        projectKey: project.projectKey,
        kind: project.kind,
        mode: options.mode,
        inputHash,
        outputDir: manifestOutput(project),
        outputFiles,
        builtAt: new Date().toISOString(),
      };
      writeManifest(manifest);
    }
  }

  if (options.useCache && !options.targets.length) {
    cleanupStaleOutputs(manifest, new Set(discovered.map(project => project.projectKey)), logger);
    writeManifest(manifest);
  }
  logger.info(`[build] Completed. built=${summary.built} skipped=${summary.skipped}`);
}

function watch(options: BuildOptions): void {
  const roots = ['src', 'util', '@types', 'tools'].map(name => path.join(rootDir, name)).filter(fs.existsSync);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let queued = false;
  let closing = false;

  const trigger = async (): Promise<void> => {
    if (closing) return;
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      await runBuild({ ...options, clearCache: false });
    } catch (error) {
      console.error(error instanceof Error ? (error.stack ?? error.message) : error);
    } finally {
      running = false;
      if (queued && !closing) {
        queued = false;
        await trigger();
      }
    }
  };

  const watcher = chokidar.watch(roots, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
  });
  const scheduleBuild = (): void => {
    if (closing) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void trigger();
    }, 120);
  };
  watcher
    .on('all', event => {
      if (event === 'add' || event === 'addDir' || event === 'change' || event === 'unlink' || event === 'unlinkDir') {
        scheduleBuild();
      }
    })
    .on('error', error => {
      console.error('[build] Watcher error:', error);
    });

  const close = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    clearTimeout(timer);
    await watcher.close();
    process.exitCode = 0;
  };

  console.info(`[build] Watching ${roots.map(root => path.relative(rootDir, root)).join(', ')}...`);
  process.once('SIGINT', () => {
    void close();
  });
  process.once('SIGTERM', () => {
    void close();
  });
}

async function main(): Promise<void> {
  const options = parseBuildOptions(process.argv.slice(2));
  if (options.help) {
    printBuildHelp();
    return;
  }
  await runBuild(options);
  if (options.watch) watch(options);
}

main().catch(error => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});
