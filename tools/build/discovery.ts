import fs from 'node:fs';
import path from 'node:path';
import {
  buildStagingDir,
  distDir,
  isSubPath,
  pluginsDistDir,
  pluginsSrcDir,
  rootDir,
  scriptsDistDir,
  scriptsSrcDir,
  srcDir,
  toPosix,
} from './config.ts';
import type { BuildKind, BuildMode, Project } from './types.ts';

const entryPattern = '**/index.{ts,tsx,js,jsx}';

function discoverScriptProjects(): Project[] {
  if (!fs.existsSync(scriptsSrcDir)) return [];
  const entries = fs.globSync(entryPattern, { cwd: scriptsSrcDir }).sort();
  const byDirectory = new Map<string, string>();
  for (const entry of entries) {
    const directory = path.dirname(entry);
    const previous = byDirectory.get(directory);
    if (previous)
      throw new Error(`[build] Duplicate entry in 'src/scripts/${toPosix(directory)}': ${previous}, ${entry}.`);
    byDirectory.set(directory, entry);
  }
  assertNoNestedProjects([...byDirectory.keys()], 'scripts');

  return [...byDirectory.values()].map(relativeEntry => {
    const relativeDir = path.dirname(relativeEntry) === '.' ? '' : path.dirname(relativeEntry);
    const projectRoot = path.join(scriptsSrcDir, relativeDir);
    const htmlCandidate = path.join(projectRoot, 'index.html');
    const htmlEntry = fs.existsSync(htmlCandidate) ? htmlCandidate : null;
    const name = relativeDir ? toPosix(relativeDir) : 'root';
    return {
      area: 'scripts',
      kind: htmlEntry ? 'frontend' : 'script',
      name,
      projectKey: `scripts/${name}`,
      relativeDir,
      projectRoot,
      entryFile: path.join(scriptsSrcDir, relativeEntry),
      htmlEntry,
      finalOutputDir: relativeDir ? path.join(scriptsDistDir, relativeDir) : scriptsDistDir,
      stagingOutputDir: path.join(buildStagingDir, 'scripts', ...name.split('/')),
    };
  });
}

function discoverPluginProjects(): Project[] {
  if (!fs.existsSync(pluginsSrcDir)) return [];
  return fs
    .readdirSync(pluginsSrcDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== '@types')
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => {
      const entryFile = path.join(pluginsSrcDir, entry.name, 'index.ts');
      if (!fs.existsSync(entryFile)) return [];
      return [
        {
          area: 'plugins' as const,
          kind: 'plugin' as const,
          name: entry.name,
          projectKey: `plugins/${entry.name}`,
          relativeDir: entry.name,
          projectRoot: path.dirname(entryFile),
          entryFile,
          htmlEntry: null,
          finalOutputDir: path.join(pluginsDistDir, entry.name),
          stagingOutputDir: path.join(buildStagingDir, 'plugins', entry.name),
        },
      ];
    });
}

export function assertNoNestedProjects(directories: string[], area: string): void {
  const sorted = directories.map(value => path.normalize(value)).sort((a, b) => a.length - b.length);
  for (let index = 0; index < sorted.length; index += 1) {
    for (let nested = index + 1; nested < sorted.length; nested += 1) {
      if (isSubPath(sorted[index], sorted[nested]) && sorted[index] !== sorted[nested]) {
        throw new Error(
          `[build] Nested ${area} projects are not supported: '${sorted[index]}' contains '${sorted[nested]}'.`,
        );
      }
    }
  }
}

export function discoverProjects(): Project[] {
  return [...discoverScriptProjects(), ...discoverPluginProjects()];
}

export function selectProjects(projects: Project[], selectedKinds: BuildKind[], targets: string[]): Project[] {
  let selected = selectedKinds.length ? projects.filter(project => selectedKinds.includes(project.area)) : projects;
  if (!targets.length) return selected;

  const normalizedTargets = targets.map(normalizeTarget);
  selected = selected.filter(project => normalizedTargets.includes(project.projectKey));
  const found = new Set(selected.map(project => project.projectKey));
  const missing = normalizedTargets.filter(target => !found.has(target));
  if (missing.length) throw new Error(`[build] Unknown build target(s): ${missing.join(', ')}.`);
  return selected;
}

function normalizeTarget(rawTarget: string): string {
  const normalized = path.normalize(rawTarget.trim().replace(/[\\/]+/g, path.sep));
  const absolute = path.isAbsolute(normalized) ? path.resolve(normalized) : path.resolve(rootDir, normalized);
  let relative: string;
  if (isSubPath(srcDir, absolute)) relative = path.relative(srcDir, absolute);
  else {
    const withoutPrefix = normalized.startsWith(`src${path.sep}`) ? normalized.slice(4) : normalized;
    relative = withoutPrefix;
  }
  const posix = toPosix(relative).replace(/^\.\//, '').replace(/\/$/, '');
  if (!/^(scripts|plugins)\//.test(posix)) {
    throw new Error(`[build] Target '${rawTarget}' must start with scripts/ or plugins/.`);
  }
  return posix;
}

export function assertProjectConstraints(project: Project): void {
  if (project.area === 'scripts') {
    const vueFiles = fs.globSync('**/*.vue', { cwd: project.projectRoot });
    if (vueFiles.length) throw new Error(`[build] Vue files are not supported in '${project.projectKey}'.`);
  }
}

export function collectFiles(inputDir: string): string[] {
  if (!fs.existsSync(inputDir)) return [];
  return fs
    .globSync('**/*', { cwd: inputDir })
    .filter(relative => fs.statSync(path.join(inputDir, relative)).isFile())
    .map(toPosix)
    .sort();
}

export function inspectProjectOutput(project: Project, outputDir: string, mode: BuildMode) {
  const files = collectFiles(outputDir);
  const allowed =
    project.kind === 'frontend'
      ? ['index.html']
      : project.kind === 'script'
        ? mode === 'development'
          ? ['index.js', 'index.js.map']
          : ['index.js']
        : mode === 'development'
          ? ['index.cjs', 'index.cjs.map']
          : ['index.cjs'];
  const required = allowed.filter(file => !file.endsWith('.map'));
  return {
    files,
    allowed,
    valid: files.every(file => allowed.includes(file)) && required.every(file => files.includes(file)),
  };
}

export function removeEmptyDirectories(targetDir: string): boolean {
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) return false;
  for (const name of fs.readdirSync(targetDir)) removeEmptyDirectories(path.join(targetDir, name));
  if (fs.readdirSync(targetDir).length) return false;
  fs.rmdirSync(targetDir);
  return true;
}

export function outputDirRelative(project: Project): string {
  return toPosix(path.relative(distDir, project.finalOutputDir));
}
