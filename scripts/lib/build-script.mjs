import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { minify as terserMinify } from 'terser';
import { build } from 'vite';
import { resolveExternalCdnUrl, shouldExternalizeScriptImport } from './package-resolver.mjs';
import { resolveAlias, terserOptions } from './vite-config.mjs';

/**
 * @param {import('./project-discovery.mjs').Project} project
 * @param {{ mode: 'production' | 'development'; isProduction: boolean }} buildContext
 */
export async function buildScriptProject(project, buildContext) {
  await build({
    configFile: false,
    mode: buildContext.mode,
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(buildContext.mode),
      'process.env': JSON.stringify({ NODE_ENV: buildContext.mode }),
    },
    resolve: {
      alias: resolveAlias,
    },
    build: {
      target: 'es2020',
      outDir: project.stagingOutputDir,
      emptyOutDir: false,
      sourcemap: buildContext.mode === 'development',
      minify: buildContext.isProduction ? 'terser' : false,
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
          compact: buildContext.isProduction,
          inlineDynamicImports: true,
          manualChunks: undefined,
          paths: request => resolveExternalCdnUrl(request),
        },
      },
    },
  });
}

/**
 * @param {import('./project-discovery.mjs').Project} project
 */
export function inlineScriptProjectCss(project) {
  const cssFiles = fs
    .globSync('**/*.css', { cwd: project.stagingOutputDir })
    .map(relative => path.join(project.stagingOutputDir, relative))
    .filter(file => fs.existsSync(file));

  if (cssFiles.length === 0) {
    return;
  }

  const entryFile = path.join(project.stagingOutputDir, 'index.js');
  if (!fs.existsSync(entryFile)) {
    throw new Error(`[build] Missing script entry output for CSS inlining: '${project.relativeDir || '.'}'.`);
  }

  const styleKey = project.projectKey.replace(/[^a-zA-Z0-9_-]+/g, '_');
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
 * @param {import('./project-discovery.mjs').Project} project
 * @param {{ mode: 'production' | 'development' }} buildContext
 */
export function normalizeScriptProjectRuntime(project, buildContext) {
  const entryFile = path.join(project.stagingOutputDir, 'index.js');
  if (!fs.existsSync(entryFile)) {
    throw new Error(`[build] Missing script entry output for runtime normalization: '${project.relativeDir || '.'}'.`);
  }

  const source = fs.readFileSync(entryFile, 'utf8');
  const normalized = source.replaceAll('process.env.NODE_ENV', JSON.stringify(buildContext.mode));
  if (normalized !== source) {
    fs.writeFileSync(entryFile, normalized, 'utf8');
  }
}

/**
 * @param {import('./project-discovery.mjs').Project} project
 * @param {{ isProduction: boolean }} buildContext
 */
export async function finalMinifyScriptProject(project, buildContext) {
  if (!buildContext.isProduction) {
    return;
  }

  const entryFile = path.join(project.stagingOutputDir, 'index.js');
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
