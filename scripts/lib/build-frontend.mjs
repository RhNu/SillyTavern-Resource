import react from '@vitejs/plugin-react';
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolveAlias, terserOptions } from './vite-config.mjs';

/**
 * @param {import('./project-discovery.mjs').Project} project
 * @param {{ mode: 'production' | 'development'; isProduction: boolean }} buildContext
 */
export async function buildFrontendProject(project, buildContext) {
  await build({
    configFile: false,
    mode: buildContext.mode,
    root: project.projectRoot,
    publicDir: false,
    plugins: [react(), viteSingleFile()],
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
      sourcemap: false,
      minify: buildContext.isProduction ? 'terser' : false,
      terserOptions,
      cssCodeSplit: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      rollupOptions: {
        input: project.htmlEntry,
        output: {
          compact: buildContext.isProduction,
          inlineDynamicImports: true,
          manualChunks: undefined,
        },
      },
    },
  });
}
