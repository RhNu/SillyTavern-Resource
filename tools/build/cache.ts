import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { buildCacheDir, buildManifestPath, buildStagingDir, distDir, fromPosix, rootDir, toPosix } from './config.ts';
import { collectFiles, outputDirRelative, removeEmptyDirectories } from './discovery.ts';
import type { BuildManifest, Logger, Project } from './types.ts';

const manifestVersion = 2;
const manifestEntrySchema = z.object({
  projectKey: z.string(),
  kind: z.enum(['frontend', 'script', 'plugin']),
  mode: z.enum(['production', 'development']),
  inputHash: z.string(),
  outputDir: z.string(),
  outputFiles: z.array(z.string()),
  builtAt: z.string(),
});
const manifestSchema = z.object({
  version: z.literal(manifestVersion),
  projects: z.record(z.string(), manifestEntrySchema),
});

export function emptyManifest(): BuildManifest {
  return { version: manifestVersion, projects: {} };
}

export function clearBuildCache(): void {
  fs.rmSync(buildCacheDir, { recursive: true, force: true });
}

export function readManifest(): BuildManifest {
  if (!fs.existsSync(buildManifestPath)) return emptyManifest();
  return parseManifest(fs.readFileSync(buildManifestPath, 'utf8'));
}

export function parseManifest(content: string): BuildManifest {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[build] Invalid cache manifest. Run with --clear-cache. (${message})`);
  }

  const parsed = manifestSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`[build] Invalid cache manifest. Run with --clear-cache.\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export function writeManifest(manifest: BuildManifest): void {
  fs.mkdirSync(path.dirname(buildManifestPath), { recursive: true });
  fs.writeFileSync(buildManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function addGlob(files: Set<string>, pattern: string): void {
  for (const relative of fs.globSync(pattern, { cwd: rootDir }).sort()) {
    const absolute = path.join(rootDir, fromPosix(relative));
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) files.add(toPosix(relative));
  }
}

export function fingerprint(project: Project): { inputHash: string; inputFiles: string[] } {
  const files = new Set<string>();
  addGlob(files, `${toPosix(path.relative(rootDir, project.projectRoot))}/**/*`);
  addGlob(files, 'tools/build/**/*.ts');
  addGlob(files, 'tools/build.ts');
  if (project.area === 'scripts') {
    addGlob(files, 'util/**/*');
    addGlob(files, '@types/**/*');
    addGlob(files, 'postcss.config.*');
    addGlob(files, 'tailwind.css');
    addGlob(files, 'tsconfig.json');
  } else {
    addGlob(files, 'src/plugins/@types/**/*');
    addGlob(files, 'tsconfig.plugins.json');
  }
  for (const fixed of ['package.json', 'pnpm-lock.yaml']) addGlob(files, fixed);

  const inputFiles = [...files].sort();
  const hash = createHash('sha256');
  for (const relative of inputFiles) {
    hash
      .update(relative)
      .update('\0')
      .update(fs.readFileSync(path.join(rootDir, fromPosix(relative))))
      .update('\0');
  }
  return { inputFiles, inputHash: hash.digest('hex') };
}

export function prepareStaging(project: Project): void {
  fs.rmSync(project.stagingOutputDir, { recursive: true, force: true });
  fs.mkdirSync(project.stagingOutputDir, { recursive: true });
}

export function syncOutput(project: Project): void {
  fs.rmSync(project.finalOutputDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(project.finalOutputDir), { recursive: true });
  fs.cpSync(project.stagingOutputDir, project.finalOutputDir, { recursive: true, force: true });
}

export function cleanupStaleOutputs(manifest: BuildManifest, activeKeys: Set<string>, logger: Logger): void {
  for (const [key, entry] of Object.entries(manifest.projects)) {
    if (activeKeys.has(key)) continue;
    const outputDir = path.resolve(distDir, fromPosix(entry.outputDir));
    if (outputDir !== distDir && outputDir.startsWith(`${distDir}${path.sep}`)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.rmSync(path.join(buildStagingDir, ...key.split('/')), { recursive: true, force: true });
    delete manifest.projects[key];
    logger.info(`[build] Removed stale output: ${key}`);
  }
  removeEmptyDirectories(buildStagingDir);
  removeEmptyDirectories(distDir);
}

export function manifestOutput(project: Project): string {
  return outputDirRelative(project);
}

export function finalFiles(project: Project): string[] {
  return collectFiles(project.finalOutputDir);
}
