import path from 'node:path';

export const rootDir = path.resolve(import.meta.dirname, '..', '..');
export const srcDir = path.join(rootDir, 'src');
export const distDir = path.join(rootDir, 'dist');
export const cacheDir = path.join(rootDir, '.cache');
export const buildCacheDir = path.join(cacheDir, 'build');
export const buildManifestPath = path.join(buildCacheDir, 'manifest.json');
export const buildStagingDir = path.join(buildCacheDir, 'staging');

export const toPosix = value => value.split(path.sep).join('/');
export const fromPosix = value => value.split('/').join(path.sep);

/**
 * @param {string} parent
 * @param {string} child
 */
export function isSubPath(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * @param {string} projectKey
 */
export function projectKeyToPath(projectKey) {
  return projectKey === 'root' ? '' : fromPosix(projectKey);
}
