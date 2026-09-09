import path from 'node:path';

export const rootDir = path.resolve(import.meta.dirname, '..', '..');
export const srcDir = path.join(rootDir, 'src');
export const scriptsSrcDir = path.join(srcDir, 'scripts');
export const pluginsSrcDir = path.join(srcDir, 'plugins');
export const distDir = path.join(rootDir, 'dist');
export const scriptsDistDir = path.join(distDir, 'scripts');
export const pluginsDistDir = path.join(distDir, 'plugins');
export const cacheDir = path.join(rootDir, '.cache');
export const buildCacheDir = path.join(cacheDir, 'build');
export const buildManifestPath = path.join(buildCacheDir, 'manifest.json');
export const buildStagingDir = path.join(buildCacheDir, 'staging');

export const toPosix = (value: string): string => value.split(path.sep).join('/');
export const fromPosix = (value: string): string => value.split('/').join(path.sep);

export function isSubPath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
