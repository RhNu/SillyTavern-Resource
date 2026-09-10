import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from './config.ts';

const specialCdnMapping: Record<string, string> = {
  sass: 'https://jspm.dev/sass',
};

const externalCdnMapping: Record<string, string> = {
  jquery: 'https://testingcf.jsdelivr.net/npm/jquery/+esm',
  lodash: 'https://testingcf.jsdelivr.net/npm/lodash/+esm',
  showdown: 'https://testingcf.jsdelivr.net/npm/showdown/+esm',
  toastr: 'https://testingcf.jsdelivr.net/npm/toastr/+esm',
  yaml: 'https://testingcf.jsdelivr.net/npm/yaml/+esm',
  zod: 'https://testingcf.jsdelivr.net/npm/zod/+esm',
};

// React DOM's CommonJS build loads scheduler with require(). If scheduler is
// externalized, Rolldown must leave that require() in the ESM output, which is
// not executable in the browser. Keep the whole React runtime in the bundle.
const inlinePackageHints = ['react', 'pixi', 'scheduler'];
const reactRuntimePackages = ['react', 'react-dom'];
const inlineDecisionCache = new Map<string, boolean>();

export function isLocalOrAliasedRequest(request: string): boolean {
  return (
    request.startsWith('.') ||
    request.startsWith('/') ||
    request.startsWith('@/') ||
    request.startsWith('@scripts/') ||
    request.startsWith('@util/') ||
    request.startsWith('http://') ||
    request.startsWith('https://') ||
    request.startsWith('data:') ||
    path.isAbsolute(request)
  );
}

function barePackageName(request: string): string | null {
  if (!request || isLocalOrAliasedRequest(request)) return null;
  const cleaned = request.replace(/^node:/, '');
  if (cleaned.startsWith('@')) return cleaned.split('/').slice(0, 2).join('/');
  return cleaned.split('/')[0] || null;
}

function packageUsesReactRuntime(packageName: string): boolean {
  const cached = inlineDecisionCache.get(packageName);
  if (cached !== undefined) return cached;
  const packageJsonPath = path.join(rootDir, 'node_modules', ...packageName.split('/'), 'package.json');
  let result = false;
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as Record<
        string,
        Record<string, string>
      >;
      const dependencies = {
        ...packageJson.peerDependencies,
        ...packageJson.dependencies,
        ...packageJson.optionalDependencies,
      };
      result = reactRuntimePackages.some(name => typeof dependencies[name] === 'string');
    } catch (error) {
      console.warn(`[build] Failed to inspect '${packageName}'.`, error);
    }
  }
  inlineDecisionCache.set(packageName, result);
  return result;
}

export function shouldExternalizeScriptImport(request: string): boolean {
  if (!request || request.startsWith('\0') || isLocalOrAliasedRequest(request)) return false;
  if (inlinePackageHints.some(keyword => request.includes(keyword))) return false;
  const packageName = barePackageName(request);
  return packageName ? !packageUsesReactRuntime(packageName) : true;
}

export function resolveExternalCdnUrl(request: string): string {
  return (
    specialCdnMapping[request] ?? externalCdnMapping[request] ?? `https://testingcf.jsdelivr.net/npm/${request}/+esm`
  );
}
