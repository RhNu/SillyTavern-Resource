import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './config.mjs';

const CDN_SPECIAL_MAPPING = {
  sass: 'https://jspm.dev/sass',
};

const CDN_EXTERNAL_MAPPING = {
  jquery: 'https://testingcf.jsdelivr.net/npm/jquery/+esm',
  lodash: 'https://testingcf.jsdelivr.net/npm/lodash/+esm',
  showdown: 'https://testingcf.jsdelivr.net/npm/showdown/+esm',
  toastr: 'https://testingcf.jsdelivr.net/npm/toastr/+esm',
  yaml: 'https://testingcf.jsdelivr.net/npm/yaml/+esm',
  zod: 'https://testingcf.jsdelivr.net/npm/zod/+esm',
};

// Keep packages that share runtime singletons in the same bundle.
const INLINE_PACKAGE_HINTS = ['react', 'pixi'];
const REACT_RUNTIME_PACKAGE_NAMES = ['react', 'react-dom'];
const inlinePackageDecisionCache = new Map();

/**
 * @param {string} request
 */
function getBarePackageName(request) {
  if (!request || isLocalOrAliasedRequest(request)) {
    return null;
  }

  const cleaned = request.replace(/^node:/, '');
  if (cleaned.startsWith('@')) {
    const segments = cleaned.split('/');
    return segments.length >= 2 ? `${segments[0]}/${segments[1]}` : cleaned;
  }

  const [packageName] = cleaned.split('/');
  return packageName || null;
}

/**
 * @param {string} packageName
 */
function packageUsesReactRuntime(packageName) {
  const cached = inlinePackageDecisionCache.get(packageName);
  if (typeof cached === 'boolean') {
    return cached;
  }

  const packageJsonPath = path.join(rootDir, 'node_modules', ...packageName.split('/'), 'package.json');
  let shouldInline = false;

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = {
        ...packageJson.peerDependencies,
        ...packageJson.dependencies,
        ...packageJson.optionalDependencies,
      };

      shouldInline = REACT_RUNTIME_PACKAGE_NAMES.some(name => typeof deps?.[name] === 'string');
    } catch (error) {
      console.warn(`[build] Failed to inspect package metadata for '${packageName}'.`, error);
    }
  }

  inlinePackageDecisionCache.set(packageName, shouldInline);
  return shouldInline;
}

/**
 * @param {string} request
 */
export function isLocalOrAliasedRequest(request) {
  return (
    request.startsWith('.') ||
    request.startsWith('/') ||
    request.startsWith('@/') ||
    request.startsWith('@util/') ||
    request.startsWith('http://') ||
    request.startsWith('https://') ||
    request.startsWith('data:') ||
    path.isAbsolute(request)
  );
}

/**
 * @param {string} request
 */
function shouldInlinePackageRequest(request) {
  if (INLINE_PACKAGE_HINTS.some(keyword => request.includes(keyword))) {
    return true;
  }

  const packageName = getBarePackageName(request);
  return packageName ? packageUsesReactRuntime(packageName) : false;
}

/**
 * @param {string} request
 */
export function shouldExternalizeScriptImport(request) {
  if (!request || request.startsWith('\0')) {
    return false;
  }

  if (isLocalOrAliasedRequest(request)) {
    return false;
  }

  if (shouldInlinePackageRequest(request)) {
    return false;
  }

  return true;
}

/**
 * @param {string} request
 */
export function resolveExternalCdnUrl(request) {
  return (
    CDN_SPECIAL_MAPPING[request] ??
    CDN_EXTERNAL_MAPPING[request] ??
    `https://testingcf.jsdelivr.net/npm/${request}/+esm`
  );
}
