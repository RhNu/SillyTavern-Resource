import fs from 'node:fs';
import path from 'node:path';
import { buildStagingDir, distDir, isSubPath, rootDir, srcDir, toPosix } from './config.mjs';

/** @typedef {'script' | 'frontend'} ProjectKind */

/**
 * @typedef Project
 * @property {string} entryFile
 * @property {string | null} htmlEntry
 * @property {string} projectRoot
 * @property {string} projectKey
 * @property {string} relativeDir
 * @property {string} finalOutputDir
 * @property {string} stagingOutputDir
 * @property {ProjectKind} kind
 */

/**
 * @param {string} inputDir
 * @returns {string[]}
 */
export function collectFiles(inputDir) {
  if (!fs.existsSync(inputDir)) {
    return [];
  }

  /** @type {string[]} */
  const result = [];
  const stack = [''];

  while (stack.length > 0) {
    const relative = stack.pop();
    const absolute = relative ? path.join(inputDir, relative) : inputDir;

    for (const entryName of fs.readdirSync(absolute)) {
      const entryRelative = relative ? path.join(relative, entryName) : entryName;
      const entryAbsolute = path.join(inputDir, entryRelative);
      const stat = fs.statSync(entryAbsolute);
      if (stat.isDirectory()) {
        stack.push(entryRelative);
      } else {
        result.push(toPosix(entryRelative));
      }
    }
  }

  return result.sort();
}

/**
 * @param {string} inputDir
 * @returns {string[]}
 */
export function collectDirectFiles(inputDir) {
  if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(inputDir)
    .filter(entryName => fs.statSync(path.join(inputDir, entryName)).isFile())
    .map(entryName => toPosix(entryName))
    .sort();
}

/**
 * @param {string} targetDir
 * @returns {boolean}
 */
export function removeEmptyDirectories(targetDir) {
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    return false;
  }

  for (const entryName of fs.readdirSync(targetDir)) {
    const entryPath = path.join(targetDir, entryName);
    if (fs.statSync(entryPath).isDirectory()) {
      removeEmptyDirectories(entryPath);
    }
  }

  if (fs.readdirSync(targetDir).length === 0) {
    fs.rmdirSync(targetDir);
    return true;
  }

  return false;
}

/**
 * @returns {Project[]}
 */
export function discoverProjects() {
  if (!fs.existsSync(srcDir)) {
    return [];
  }

  const entries = fs.globSync('**/index.{ts,tsx,js,jsx}', { cwd: srcDir }).sort();
  if (entries.length === 0) {
    return [];
  }

  /** @type {Map<string, string>} */
  const projectEntryByDir = new Map();
  for (const entry of entries) {
    const dir = path.dirname(entry);
    const existed = projectEntryByDir.get(dir);
    if (existed) {
      throw new Error(`[build] Duplicate project entry in '${dir}': '${existed}' and '${entry}'.`);
    }
    projectEntryByDir.set(dir, entry);
  }

  const dirs = [...projectEntryByDir.keys()].sort((lhs, rhs) => lhs.length - rhs.length);
  for (let i = 0; i < dirs.length; i += 1) {
    for (let j = i + 1; j < dirs.length; j += 1) {
      const parent = dirs[i];
      const child = dirs[j];
      if (child !== parent && child.startsWith(`${parent}${path.sep}`)) {
        throw new Error(`[build] Nested project folders are not supported yet: '${parent}' is parent of '${child}'.`);
      }
    }
  }

  return [...projectEntryByDir.values()].map(relativeEntry => {
    const entryFile = path.join(srcDir, relativeEntry);
    const projectRoot = path.dirname(entryFile);
    const htmlEntryCandidate = path.join(projectRoot, 'index.html');
    const htmlEntry = fs.existsSync(htmlEntryCandidate) ? htmlEntryCandidate : null;
    const relativeDir = path.dirname(relativeEntry) === '.' ? '' : path.dirname(relativeEntry);
    const projectKey = relativeDir === '' ? 'root' : toPosix(relativeDir);
    const finalOutputDir = relativeDir ? path.join(distDir, relativeDir) : distDir;
    const stagingOutputDir = path.join(buildStagingDir, ...(projectKey === 'root' ? ['root'] : projectKey.split('/')));

    return {
      entryFile,
      htmlEntry,
      projectRoot,
      projectKey,
      relativeDir,
      finalOutputDir,
      stagingOutputDir,
      kind: htmlEntry === null ? 'script' : 'frontend',
    };
  });
}

/**
 * @param {Project} project
 */
export function assertProjectConstraints(project) {
  const vueFiles = fs.globSync('**/*.vue', { cwd: project.projectRoot });
  if (vueFiles.length > 0) {
    throw new Error(
      `[build] Vue files are no longer supported in '${project.relativeDir || '.'}': ${vueFiles.join(', ')}`,
    );
  }
}

/**
 * @param {string} rawTarget
 */
export function normalizeBuildTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (!trimmed) {
    throw new Error('[build] Target cannot be empty.');
  }

  const normalizedInput = path.normalize(trimmed.replace(/[\\/]+/g, path.sep));
  const absoluteTarget = path.isAbsolute(normalizedInput)
    ? path.resolve(normalizedInput)
    : normalizedInput === 'src' || normalizedInput.startsWith(`src${path.sep}`)
      ? path.resolve(rootDir, normalizedInput)
      : path.resolve(srcDir, normalizedInput);

  if (!isSubPath(srcDir, absoluteTarget)) {
    throw new Error(`[build] Target '${rawTarget}' must stay within 'src'.`);
  }

  if (!fs.existsSync(absoluteTarget)) {
    throw new Error(`[build] Target '${rawTarget}' does not exist under 'src'.`);
  }

  if (!fs.statSync(absoluteTarget).isDirectory()) {
    throw new Error(`[build] Target '${rawTarget}' must point to a project directory under 'src'.`);
  }

  const relativeTarget = path.relative(srcDir, absoluteTarget);
  return relativeTarget === '' ? 'root' : toPosix(relativeTarget);
}

/**
 * @param {Project[]} projects
 * @param {string[]} rawTargets
 */
export function filterProjectsByTargets(projects, rawTargets) {
  if (rawTargets.length === 0) {
    return {
      projects,
      normalizedTargets: [],
    };
  }

  const projectByKey = new Map(projects.map(project => [project.projectKey, project]));
  /** @type {string[]} */
  const normalizedTargets = [];

  for (const rawTarget of rawTargets) {
    const normalizedTarget = normalizeBuildTarget(rawTarget);
    if (normalizedTargets.includes(normalizedTarget)) {
      continue;
    }

    if (!projectByKey.has(normalizedTarget)) {
      throw new Error(`[build] Target '${rawTarget}' is not a buildable project root under 'src'.`);
    }

    normalizedTargets.push(normalizedTarget);
  }

  return {
    normalizedTargets,
    projects: normalizedTargets.map(target => /** @type {Project} */ (projectByKey.get(target))),
  };
}

/**
 * @param {Project} project
 * @param {'production' | 'development'} mode
 */
export function getAllowedOutputFiles(project, mode) {
  const allowed = project.kind === 'script' ? ['index.js'] : ['index.html'];
  if (mode === 'development' && project.kind === 'script') {
    allowed.push('index.js.map');
  }

  return allowed;
}

/**
 * @param {Project} project
 */
export function getPotentialOutputFiles(project) {
  return project.kind === 'script' ? ['index.js', 'index.js.map'] : ['index.html'];
}

/**
 * @param {Project} project
 * @param {string} outputDir
 */
export function collectProjectOutputFiles(project, outputDir) {
  return project.projectKey === 'root' ? collectDirectFiles(outputDir) : collectFiles(outputDir);
}

/**
 * @param {Project} project
 * @param {string} outputDir
 * @param {'production' | 'development'} mode
 */
export function inspectProjectOutput(project, outputDir, mode) {
  const files = collectProjectOutputFiles(project, outputDir);
  const allowed = getAllowedOutputFiles(project, mode);
  const invalid = files.filter(file => !allowed.includes(file));
  const missing = allowed.filter(file => !file.endsWith('.map') && !files.includes(file));

  return {
    files,
    allowed,
    invalid,
    missing,
    valid: invalid.length === 0 && missing.length === 0,
  };
}
