import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { buildFrontendProject } from './lib/build-frontend.mjs';
import {
  cleanupStaleBuildArtifacts,
  clearBuildCache,
  computeProjectFingerprint,
  createEmptyBuildManifest,
  prepareProjectStaging,
  readBuildManifest,
  syncProjectOutput,
  writeBuildManifest,
} from './lib/build-cache.mjs';
import { getBuildHelpText, parseBuildOptions } from './lib/build-options.mjs';
import { buildScriptProject, finalMinifyScriptProject, inlineScriptProjectCss, normalizeScriptProjectRuntime } from './lib/build-script.mjs';
import { distDir } from './lib/config.mjs';
import { createLogger } from './lib/logger.mjs';
import {
  assertProjectConstraints,
  discoverProjects,
  filterProjectsByTargets,
  inspectProjectOutput,
  removeEmptyDirectories,
} from './lib/project-discovery.mjs';

/**
 * @param {import('./lib/project-discovery.mjs').Project} project
 * @param {'production' | 'development'} mode
 * @param {string} outputDir
 */
function validateProjectOutput(project, mode, outputDir) {
  const inspection = inspectProjectOutput(project, outputDir, mode);
  if (!inspection.valid) {
    throw new Error(
      [
        `[build] '${project.relativeDir || '.'}' did not produce a valid single-file output.`,
        `- output files: ${inspection.files.join(', ') || '(none)'}`,
        `- allowed files: ${inspection.allowed.join(', ')}`,
      ].join('\n'),
    );
  }

  return inspection.files;
}

/**
 * @param {import('./lib/project-discovery.mjs').Project} project
 * @param {'production' | 'development'} mode
 */
function inspectFinalCacheOutput(project, mode) {
  return inspectProjectOutput(project, project.finalOutputDir, mode);
}

/**
 * @param {import('./lib/project-discovery.mjs').Project} project
 * @param {{ mode: 'production' | 'development'; isProduction: boolean }} buildContext
 */
async function rebuildProject(project, buildContext) {
  prepareProjectStaging(project);

  if (project.kind === 'frontend') {
    await buildFrontendProject(project, buildContext);
  } else {
    await buildScriptProject(project, buildContext);
    normalizeScriptProjectRuntime(project, buildContext);
    inlineScriptProjectCss(project);
    await finalMinifyScriptProject(project, buildContext);
  }

  removeEmptyDirectories(project.stagingOutputDir);
  validateProjectOutput(project, buildContext.mode, project.stagingOutputDir);
  syncProjectOutput(project);
  return validateProjectOutput(project, buildContext.mode, project.finalOutputDir);
}

async function main() {
  const options = parseBuildOptions(process.argv.slice(2));
  if (options.help) {
    console.info(getBuildHelpText());
    return;
  }

  const logger = createLogger({ verbose: options.verbose });
  const buildContext = {
    mode: options.mode,
    isProduction: options.mode === 'production',
  };

  logger.info(`[build] mode=${options.mode} cache=${options.useCache ? 'on' : 'off'} verbose=${options.verbose ? 'on' : 'off'}`);
  logger.debug(`[build] raw targets: ${options.targets.length > 0 ? options.targets.join(', ') : '(all)'}`);

  const projects = discoverProjects();
  const { projects: selectedProjects, normalizedTargets } = filterProjectsByTargets(projects, options.targets);
  logger.info(
    `[build] selected projects=${selectedProjects.length}${normalizedTargets.length > 0 ? ` targets=${normalizedTargets.join(', ')}` : ' targets=(all)'}`,
  );

  if (options.clearCache) {
    clearBuildCache();
    logger.info('[build] Cleared build cache.');
  }

  const manifest = options.useCache ? readBuildManifest() : createEmptyBuildManifest();
  const discoveredProjectKeys = new Set(projects.map(project => project.projectKey));

  if (projects.length === 0) {
    if (options.targets.length > 0) {
      throw new Error('[build] No buildable projects were discovered under src.');
    }

    fs.mkdirSync(distDir, { recursive: true });
    if (options.useCache) {
      cleanupStaleBuildArtifacts(manifest, discoveredProjectKeys, logger);
      writeBuildManifest(manifest);
    }
    logger.info('[build] No entries found in src/**/index.{ts,tsx,js,jsx}. Skipped.');
    return;
  }

  /** @type {{ built: number; rebuilt: number; skipped: number }} */
  const summary = {
    built: 0,
    rebuilt: 0,
    skipped: 0,
  };

  for (const project of selectedProjects) {
    assertProjectConstraints(project);

    const display = project.relativeDir || '.';
    const startedAt = performance.now();
    const { inputHash, inputFiles } = computeProjectFingerprint(project);
    logger.debug(`[build] ${display} fingerprint inputs=${inputFiles.length}`);
    logger.debug(`[build] ${display} staging=${project.stagingOutputDir}`);
    logger.debug(`[build] ${display} final=${project.finalOutputDir}`);

    const manifestEntry = options.useCache ? manifest.projects[project.projectKey] : undefined;
    if (options.useCache) {
      logger.debug(`[build] ${display} input hash=${inputHash}`);
    }

    let cacheStatus = 'no-cache';
    let cacheReason = 'cache disabled';
    let shouldRebuild = true;

    if (options.useCache) {
      const finalOutput = inspectFinalCacheOutput(project, options.mode);
      if (!manifestEntry) {
        cacheStatus = 'build';
        cacheReason = 'no manifest entry';
      } else if (manifestEntry.mode !== options.mode) {
        cacheStatus = 'rebuild(cache miss)';
        cacheReason = `mode changed (${manifestEntry.mode} -> ${options.mode})`;
      } else if (manifestEntry.inputHash !== inputHash) {
        cacheStatus = 'rebuild(cache miss)';
        cacheReason = 'input hash changed';
      } else if (!finalOutput.valid) {
        cacheStatus = 'rebuild(cache miss)';
        cacheReason = `final output invalid: ${finalOutput.files.join(', ') || '(none)'}`;
      } else {
        cacheStatus = 'skip(cache hit)';
        cacheReason = 'manifest hash and final output matched';
        shouldRebuild = false;
      }
    } else {
      cacheStatus = 'build';
      cacheReason = 'cache disabled';
    }

    logger.debug(`[build] ${display} cache decision: ${cacheReason}`);

    if (!shouldRebuild) {
      summary.skipped += 1;
      logger.info(`[build] ${cacheStatus} ${display}`);
      logger.debug(`[build] ${display} duration=${Math.round(performance.now() - startedAt)}ms`);
      continue;
    }

    const isRebuild = Boolean(options.useCache && manifestEntry);
    logger.info(`[build] ${cacheStatus} ${display}`);
    const outputFiles = await rebuildProject(project, buildContext);

    if (options.useCache) {
      manifest.projects[project.projectKey] = {
        projectKey: project.projectKey,
        kind: project.kind,
        mode: options.mode,
        inputHash,
        outputFiles,
        builtAt: new Date().toISOString(),
      };
      writeBuildManifest(manifest);
    }

    if (isRebuild) {
      summary.rebuilt += 1;
    } else {
      summary.built += 1;
    }

    logger.debug(`[build] ${display} duration=${Math.round(performance.now() - startedAt)}ms`);
  }

  if (options.useCache && options.targets.length === 0) {
    cleanupStaleBuildArtifacts(manifest, discoveredProjectKeys, logger);
    writeBuildManifest(manifest);
  }

  logger.info(
    `[build] Completed ${selectedProjects.length} project(s). built=${summary.built} rebuilt=${summary.rebuilt} skipped=${summary.skipped}`,
  );
}

main().catch(error => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});
