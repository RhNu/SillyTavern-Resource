import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildCacheDir, buildManifestPath, buildStagingDir, distDir, fromPosix, rootDir, toPosix } from './config.mjs';
import { collectDirectFiles, getPotentialOutputFiles, removeEmptyDirectories } from './project-discovery.mjs';

const MANIFEST_VERSION = 1;

export function createEmptyBuildManifest() {
  return {
    version: MANIFEST_VERSION,
    projects: {},
  };
}

export function clearBuildCache() {
  fs.rmSync(buildCacheDir, { recursive: true, force: true });
}

export function readBuildManifest() {
  if (!fs.existsSync(buildManifestPath)) {
    return createEmptyBuildManifest();
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `[build] Failed to read cache manifest '${buildManifestPath}': ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (parsed?.version !== MANIFEST_VERSION || typeof parsed?.projects !== 'object' || parsed.projects === null) {
    throw new Error(`[build] Cache manifest '${buildManifestPath}' is invalid. Use --clear-cache to rebuild it.`);
  }

  return {
    version: MANIFEST_VERSION,
    projects: parsed.projects,
  };
}

/**
 * @param {{ version: number; projects: Record<string, unknown> }} manifest
 */
export function writeBuildManifest(manifest) {
  fs.mkdirSync(path.dirname(buildManifestPath), { recursive: true });
  fs.writeFileSync(buildManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

/**
 * @param {Set<string>} files
 * @param {string} pattern
 */
function addMatches(files, pattern) {
  for (const relativeFile of fs.globSync(pattern, { cwd: rootDir }).sort()) {
    const absoluteFile = path.join(rootDir, fromPosix(relativeFile));
    if (fs.existsSync(absoluteFile) && fs.statSync(absoluteFile).isFile()) {
      files.add(toPosix(relativeFile));
    }
  }
}

/**
 * @param {import('./project-discovery.mjs').Project} project
 */
export function resolveProjectFingerprintInputs(project) {
  const files = new Set();
  const projectRootRelative = toPosix(path.relative(rootDir, project.projectRoot));

  addMatches(files, `${projectRootRelative}/**/*`);
  addMatches(files, 'util/**/*');
  addMatches(files, '@types/**/*');
  addMatches(files, 'scripts/lib/**/*.mjs');

  for (const fixedFile of ['scripts/build.mjs', 'package.json', 'pnpm-lock.yaml']) {
    const absoluteFile = path.join(rootDir, fixedFile);
    if (fs.existsSync(absoluteFile) && fs.statSync(absoluteFile).isFile()) {
      files.add(toPosix(fixedFile));
    }
  }

  for (const pattern of ['tsconfig*.json', 'postcss.config.*', 'tailwind.config.*']) {
    addMatches(files, pattern);
  }

  return [...files].sort();
}

/**
 * @param {import('./project-discovery.mjs').Project} project
 */
export function computeProjectFingerprint(project) {
  const inputFiles = resolveProjectFingerprintInputs(project);
  const hash = createHash('sha256');

  for (const relativeFile of inputFiles) {
    const absoluteFile = path.join(rootDir, fromPosix(relativeFile));
    hash.update(relativeFile);
    hash.update('\0');
    hash.update(fs.readFileSync(absoluteFile));
    hash.update('\0');
  }

  return {
    inputFiles,
    inputHash: hash.digest('hex'),
  };
}

/**
 * @param {import('./project-discovery.mjs').Project} project
 */
export function prepareProjectStaging(project) {
  fs.rmSync(project.stagingOutputDir, { recursive: true, force: true });
  fs.mkdirSync(project.stagingOutputDir, { recursive: true });
}

/**
 * @param {import('./project-discovery.mjs').Project} project
 */
export function syncProjectOutput(project) {
  if (project.projectKey === 'root') {
    fs.mkdirSync(distDir, { recursive: true });
    for (const fileName of getPotentialOutputFiles(project)) {
      fs.rmSync(path.join(distDir, fileName), { force: true });
    }

    for (const fileName of collectDirectFiles(project.stagingOutputDir)) {
      fs.copyFileSync(path.join(project.stagingOutputDir, fileName), path.join(distDir, fileName));
    }

    return;
  }

  fs.rmSync(project.finalOutputDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(project.finalOutputDir), { recursive: true });
  fs.cpSync(project.stagingOutputDir, project.finalOutputDir, { recursive: true, force: true });
}

/**
 * @param {string} projectKey
 * @param {{ kind?: 'script' | 'frontend'; outputFiles?: string[] } | undefined} manifestEntry
 */
function removeProjectArtifactsByKey(projectKey, manifestEntry) {
  const stagingOutputDir = path.join(buildStagingDir, ...(projectKey === 'root' ? ['root'] : projectKey.split('/')));
  fs.rmSync(stagingOutputDir, { recursive: true, force: true });

  if (projectKey === 'root') {
    const fallbackFiles =
      manifestEntry?.kind === 'frontend' ? ['index.html'] : manifestEntry?.kind === 'script' ? ['index.js', 'index.js.map'] : [];
    const filesToRemove = [...new Set([...(manifestEntry?.outputFiles ?? []), ...fallbackFiles])];
    for (const relativeFile of filesToRemove) {
      fs.rmSync(path.join(distDir, fromPosix(relativeFile)), { force: true });
    }
    return;
  }

  fs.rmSync(path.join(distDir, ...projectKey.split('/')), { recursive: true, force: true });
}

/**
 * @param {{ projects: Record<string, { kind?: 'script' | 'frontend'; outputFiles?: string[] }> }} manifest
 * @param {Set<string>} discoveredProjectKeys
 * @param {{ info: (...args: unknown[]) => void }} logger
 */
export function cleanupStaleBuildArtifacts(manifest, discoveredProjectKeys, logger) {
  for (const [projectKey, manifestEntry] of Object.entries(manifest.projects)) {
    if (discoveredProjectKeys.has(projectKey)) {
      continue;
    }

    removeProjectArtifactsByKey(projectKey, manifestEntry);
    delete manifest.projects[projectKey];
    logger.info(`[build] Removed stale output for deleted project: ${projectKey === 'root' ? '.' : projectKey}`);
  }

  removeEmptyDirectories(buildStagingDir);
  removeEmptyDirectories(distDir);
}
