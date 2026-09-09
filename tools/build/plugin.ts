import fs from 'node:fs';
import path from 'node:path';
import { build, type UserConfig } from 'tsdown';
import { rootDir } from './config.ts';
import type { BuildContext, Project } from './types.ts';

function bundledDependencies(): string[] {
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return [
    ...new Set([...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.devDependencies ?? {})]),
  ].filter(name => name !== 'canvas');
}

export async function buildPluginProject(project: Project, context: BuildContext): Promise<void> {
  const config: UserConfig = {
    entry: { index: project.entryFile },
    outDir: project.stagingOutputDir,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    dts: false,
    tsconfig: path.join(rootDir, 'tsconfig.plugins.json'),
    clean: false,
    minify: context.isProduction,
    sourcemap: context.mode === 'development',
    outExtensions: () => ({ js: '.cjs' }),
    deps: {
      alwaysBundle: bundledDependencies(),
      neverBundle: ['canvas'],
      onlyBundle: false,
    },
    outputOptions: {
      codeSplitting: false,
      entryFileNames: 'index.cjs',
    },
  };
  await build(config);
}
