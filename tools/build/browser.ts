import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { minify as terserMinify } from 'terser';
import { build, esmExternalRequirePlugin, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolveExternalCdnUrl, shouldExternalizeScriptImport } from './package-resolver.ts';
import type { BuildContext, Project } from './types.ts';
import { resolveAlias, terserOptions } from './vite-config.ts';

export async function buildBrowserProject(project: Project, context: BuildContext): Promise<void> {
  if (project.kind === 'frontend') await buildFrontend(project, context);
  else await buildScript(project, context);
}

async function buildFrontend(project: Project, context: BuildContext): Promise<void> {
  await build({
    configFile: false,
    mode: context.mode,
    root: project.projectRoot,
    publicDir: false,
    plugins: [frontendEntryPlugin(project), react(), viteSingleFile()],
    define: environmentDefines(context),
    resolve: { alias: resolveAlias },
    build: {
      target: 'es2020',
      outDir: project.stagingOutputDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: context.isProduction ? 'terser' : false,
      terserOptions,
      cssCodeSplit: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      rolldownOptions: {
        input: project.htmlEntry!,
        output: { codeSplitting: false },
      },
    },
  });
}

function frontendEntryPlugin(project: Project): Plugin {
  return {
    name: 'tavern-helper-entry',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'script',
          attrs: { type: 'module', src: `/${path.basename(project.entryFile)}` },
          injectTo: 'body',
        },
      ],
    },
  };
}

async function buildScript(project: Project, context: BuildContext): Promise<void> {
  await build({
    configFile: false,
    mode: context.mode,
    plugins: [esmExternalRequirePlugin({ external: ['scheduler'] }), react()],
    define: environmentDefines(context),
    resolve: { alias: resolveAlias },
    build: {
      target: 'es2020',
      outDir: project.stagingOutputDir,
      emptyOutDir: false,
      sourcemap: context.mode === 'development',
      minify: context.isProduction ? 'terser' : false,
      terserOptions,
      cssCodeSplit: false,
      lib: { entry: project.entryFile, formats: ['es'], fileName: () => 'index', cssFileName: 'index' },
      rolldownOptions: {
        external: shouldExternalizeScriptImport,
        output: {
          entryFileNames: 'index.js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          codeSplitting: false,
          paths: resolveExternalCdnUrl,
        },
      },
    },
  });
  normalizeRuntime(project, context);
  inlineCss(project);
  await minifyScript(project, context);
}

function environmentDefines(context: BuildContext): Record<string, string> {
  return {
    'process.env.NODE_ENV': JSON.stringify(context.mode),
    'process.env': JSON.stringify({ NODE_ENV: context.mode }),
  };
}

function normalizeRuntime(project: Project, context: BuildContext): void {
  const entryFile = path.join(project.stagingOutputDir, 'index.js');
  const source = fs.readFileSync(entryFile, 'utf8');
  fs.writeFileSync(entryFile, source.replaceAll('process.env.NODE_ENV', JSON.stringify(context.mode)), 'utf8');
}

function inlineCss(project: Project): void {
  const cssFiles = fs
    .globSync('**/*.css', { cwd: project.stagingOutputDir })
    .map(file => path.join(project.stagingOutputDir, file));
  if (!cssFiles.length) return;
  const entryFile = path.join(project.stagingOutputDir, 'index.js');
  const styleKey = project.projectKey.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const cssText = cssFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
  fs.appendFileSync(
    entryFile,
    `
;(() => {
  if (typeof document === 'undefined' || typeof getScriptId !== 'function') return;
  const scriptId = getScriptId();
  const selector = 'style[data-bundled-style="${styleKey}"][script_id="' + scriptId + '"]';
  if (document.head.querySelector(selector)) return;
  const style = document.createElement('style');
  style.setAttribute('script_id', scriptId);
  style.setAttribute('data-bundled-style', '${styleKey}');
  style.textContent = ${JSON.stringify(cssText)};
  document.head.append(style);
})();
`,
    'utf8',
  );
  for (const file of cssFiles) fs.rmSync(file, { force: true });
}

async function minifyScript(project: Project, context: BuildContext): Promise<void> {
  if (!context.isProduction) return;
  const entryFile = path.join(project.stagingOutputDir, 'index.js');
  const result = await terserMinify(fs.readFileSync(entryFile, 'utf8'), terserOptions);
  if (!result.code) throw new Error(`[build] Terser produced empty output for '${project.projectKey}'.`);
  fs.writeFileSync(entryFile, result.code.replaceAll(/\/\*[@#]__PURE__\*\/\s*/g, ''), 'utf8');
}
