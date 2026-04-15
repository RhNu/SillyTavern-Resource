import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { minify as terserMinify } from 'terser';
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const rootDir = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

const modeArg =
  process.argv.find(arg => arg.startsWith('--mode='))?.slice('--mode='.length) ?? process.argv[2] ?? 'production';
if (modeArg !== 'production' && modeArg !== 'development') {
  throw new Error(`[build] Unsupported mode '${modeArg}'. Use 'production' or 'development'.`);
}
const mode = modeArg;
const isProduction = mode === 'production';

const toPosix = value => value.split(path.sep).join('/');

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
function isLocalOrAliasedRequest(request) {
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
function shouldExternalizeScriptImport(request) {
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
function resolveExternalCdnUrl(request) {
  return (
    CDN_SPECIAL_MAPPING[request] ??
    CDN_EXTERNAL_MAPPING[request] ??
    `https://testingcf.jsdelivr.net/npm/${request}/+esm`
  );
}

const resolveAlias = [
  {
    find: /^@util$/,
    replacement: toPosix(path.join(rootDir, 'util')),
  },
  {
    find: /^@util\//,
    replacement: `${toPosix(path.join(rootDir, 'util'))}/`,
  },
  {
    find: /^@$/,
    replacement: toPosix(srcDir),
  },
  {
    find: /^@\//,
    replacement: `${toPosix(srcDir)}/`,
  },
];

const terserOptions = {
  compress: {
    ecma: 2020,
    module: true,
    toplevel: true,
    passes: 3,
  },
  mangle: {
    module: true,
    toplevel: true,
  },
  format: {
    ecma: 2020,
    comments: false,
    beautify: false,
    preserve_annotations: false,
  },
};

/** @typedef {'script' | 'frontend'} ProjectKind */

/**
 * @typedef Project
 * @property {string} entryFile
 * @property {string | null} htmlEntry
 * @property {string} projectRoot
 * @property {string} relativeDir
 * @property {string} outputDir
 * @property {ProjectKind} kind
 */

/**
 * @param {string} inputDir
 * @returns {string[]}
 */
function collectFiles(inputDir) {
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
 * @param {string} targetDir
 * @returns {boolean}
 */
function removeEmptyDirectories(targetDir) {
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
function discoverProjects() {
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
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
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
    const outputDir = path.join(distDir, relativeDir);

    return {
      entryFile,
      htmlEntry,
      projectRoot,
      relativeDir,
      outputDir,
      kind: htmlEntry === null ? 'script' : 'frontend',
    };
  });
}

/**
 * @param {Project} project
 */
function assertProjectConstraints(project) {
  const vueFiles = fs.globSync('**/*.vue', { cwd: project.projectRoot });
  if (vueFiles.length > 0) {
    throw new Error(
      `[build] Vue files are no longer supported in '${project.relativeDir || '.'}': ${vueFiles.join(', ')}`,
    );
  }
}

/**
 * @param {Project} project
 */
async function buildScriptProject(project) {
  await build({
    configFile: false,
    mode,
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env': JSON.stringify({ NODE_ENV: mode }),
    },
    resolve: {
      alias: resolveAlias,
    },
    build: {
      target: 'es2020',
      outDir: project.outputDir,
      emptyOutDir: false,
      sourcemap: mode === 'development',
      minify: isProduction ? 'terser' : false,
      terserOptions,
      cssCodeSplit: false,
      lib: {
        entry: project.entryFile,
        formats: ['es'],
        fileName: () => 'index',
        cssFileName: 'index',
      },
      rollupOptions: {
        external: request => shouldExternalizeScriptImport(request),
        output: {
          entryFileNames: 'index.js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          compact: isProduction,
          inlineDynamicImports: true,
          manualChunks: undefined,
          paths: request => resolveExternalCdnUrl(request),
        },
      },
    },
  });
}

/**
 * @param {Project} project
 */
function inlineScriptProjectCss(project) {
  const cssFiles = fs
    .globSync('**/*.css', { cwd: project.outputDir })
    .map(relative => path.join(project.outputDir, relative))
    .filter(file => fs.existsSync(file));

  if (cssFiles.length === 0) {
    return;
  }

  const entryFile = path.join(project.outputDir, 'index.js');
  if (!fs.existsSync(entryFile)) {
    throw new Error(`[build] Missing script entry output for CSS inlining: '${project.relativeDir || '.'}'.`);
  }

  const styleKey = (project.relativeDir || 'root').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const cssText = cssFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
  const injectionCode = `
;(() => {
  if (typeof document === 'undefined' || typeof getScriptId !== 'function') {
    return;
  }
  const styleKey = ${JSON.stringify(styleKey)};
  const scriptId = getScriptId();
  const selector = 'style[data-bundled-style="' + styleKey + '"][script_id="' + scriptId + '"]';
  if (document.head.querySelector(selector)) {
    return;
  }
  const style = document.createElement('style');
  style.setAttribute('script_id', scriptId);
  style.setAttribute('data-bundled-style', styleKey);
  style.textContent = ${JSON.stringify(cssText)};
  document.head.append(style);
})();
`;

  fs.appendFileSync(entryFile, injectionCode, 'utf8');
  cssFiles.forEach(file => fs.rmSync(file, { force: true }));
}

/**
 * @param {Project} project
 */
function normalizeScriptProjectRuntime(project) {
  const entryFile = path.join(project.outputDir, 'index.js');
  if (!fs.existsSync(entryFile)) {
    throw new Error(`[build] Missing script entry output for runtime normalization: '${project.relativeDir || '.'}'.`);
  }

  const source = fs.readFileSync(entryFile, 'utf8');
  const normalized = source.replaceAll('process.env.NODE_ENV', JSON.stringify(mode));
  if (normalized !== source) {
    fs.writeFileSync(entryFile, normalized, 'utf8');
  }
}

/**
 * @param {Project} project
 */
async function finalMinifyScriptProject(project) {
  if (!isProduction) {
    return;
  }

  const entryFile = path.join(project.outputDir, 'index.js');
  if (!fs.existsSync(entryFile)) {
    throw new Error(`[build] Missing script entry output for final minify: '${project.relativeDir || '.'}'.`);
  }

  const source = fs.readFileSync(entryFile, 'utf8');
  const result = await terserMinify(source, terserOptions);
  if (!result.code) {
    throw new Error(`[build] Final Terser pass produced empty output: '${project.relativeDir || '.'}'.`);
  }

  const stripped = result.code.replaceAll(/\/\*[@#]__PURE__\*\/\s*/g, '');
  fs.writeFileSync(entryFile, stripped, 'utf8');
}

/**
 * @param {Project} project
 */
async function buildFrontendProject(project) {
  await build({
    configFile: false,
    mode,
    root: project.projectRoot,
    publicDir: false,
    plugins: [react(), viteSingleFile()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env': JSON.stringify({ NODE_ENV: mode }),
    },
    resolve: {
      alias: resolveAlias,
    },
    build: {
      target: 'es2020',
      outDir: project.outputDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: isProduction ? 'terser' : false,
      terserOptions,
      cssCodeSplit: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      rollupOptions: {
        input: project.htmlEntry,
        output: {
          compact: isProduction,
          inlineDynamicImports: true,
          manualChunks: undefined,
        },
      },
    },
  });
}

/**
 * @param {Project} project
 */
function validateSingleFileOutput(project) {
  const files = collectFiles(project.outputDir);
  const allowed = project.kind === 'script' ? ['index.js'] : ['index.html'];
  if (mode === 'development' && project.kind === 'script') {
    allowed.push('index.js.map');
  }

  const invalid = files.filter(file => !allowed.includes(file));
  const requiredMissing = allowed.filter(file => !file.endsWith('.map') && !files.includes(file));

  if (invalid.length > 0 || requiredMissing.length > 0) {
    throw new Error(
      [
        `[build] '${project.relativeDir || '.'}' did not produce a valid single-file output.`,
        `- output files: ${files.join(', ') || '(none)'}`,
        `- allowed files: ${allowed.join(', ')}`,
      ].join('\n'),
    );
  }
}

async function main() {
  console.info(`[build] mode=${mode}`);

  const projects = discoverProjects();
  if (projects.length === 0) {
    fs.mkdirSync(distDir, { recursive: true });
    console.info('[build] No entries found in src/**/index.{ts,tsx,js,jsx}. Skipped.');
    return;
  }

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  for (const project of projects) {
    assertProjectConstraints(project);

    const display = project.relativeDir || '.';
    console.info(`[build] Building ${project.kind} project: ${display}`);

    if (project.kind === 'frontend') {
      await buildFrontendProject(project);
    } else {
      await buildScriptProject(project);
      normalizeScriptProjectRuntime(project);
      inlineScriptProjectCss(project);
      await finalMinifyScriptProject(project);
    }

    removeEmptyDirectories(project.outputDir);
    validateSingleFileOutput(project);
  }

  console.info(`[build] Completed ${projects.length} project(s).`);
}

main().catch(error => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});
