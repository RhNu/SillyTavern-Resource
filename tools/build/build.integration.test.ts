import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { buildBrowserProject } from './browser.ts';
import { rootDir } from './config.ts';
import { removeEmptyDirectories } from './discovery.ts';
import { buildPluginProject } from './plugin.ts';
import type { BuildContext, Project, ProjectKind } from './types.ts';

const fixtureRoot = path.join(rootDir, 'tools', 'fixtures');
const outputRoot = path.join(rootDir, '.cache', 'build-integration-test');
const context: BuildContext = { mode: 'production', isProduction: true, verbose: false };

function project(kind: ProjectKind, name: string, entryName: string): Project {
  const projectRoot = path.join(fixtureRoot, name);
  return {
    area: kind === 'plugin' ? 'plugins' : 'scripts',
    kind,
    name,
    projectKey: `${kind === 'plugin' ? 'plugins' : 'scripts'}/${name}`,
    relativeDir: name,
    projectRoot,
    entryFile: path.join(projectRoot, entryName),
    htmlEntry: kind === 'frontend' ? path.join(projectRoot, 'index.html') : null,
    finalOutputDir: path.join(outputRoot, 'final', name),
    stagingOutputDir: path.join(outputRoot, name),
  };
}

test('Vite and tsdown preserve the template output contracts', async () => {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  try {
    const frontend = project('frontend', 'frontend', 'index.tsx');
    fs.mkdirSync(frontend.stagingOutputDir, { recursive: true });
    await buildBrowserProject(frontend, context);
    const html = fs.readFileSync(path.join(frontend.stagingOutputDir, 'index.html'), 'utf8');
    expect(html).toMatch(/frontend-ready/);
    expect(fs.readdirSync(frontend.stagingOutputDir)).toEqual(['index.html']);

    const script = project('script', 'script', 'index.ts');
    fs.mkdirSync(script.stagingOutputDir, { recursive: true });
    await buildBrowserProject(script, context);
    removeEmptyDirectories(script.stagingOutputDir);
    const javascript = fs.readFileSync(path.join(script.stagingOutputDir, 'index.js'), 'utf8');
    expect(javascript).toMatch(/https:\/\/testingcf\.jsdelivr\.net\/npm\/lodash\/\+esm/);
    expect(javascript).toMatch(/https:\/\/testingcf\.jsdelivr\.net\/npm\/scheduler\/\+esm/);
    expect(javascript).not.toContain('Calling `require` for "https://testingcf.jsdelivr.net/npm/scheduler/+esm"');
    expect(javascript).not.toContain('@oxc-project/runtime');
    expect(javascript).toMatch(/data-bundled-style/);
    expect(fs.readdirSync(script.stagingOutputDir)).toEqual(['index.js']);

    const plugin = project('plugin', 'plugin', 'index.ts');
    fs.mkdirSync(plugin.stagingOutputDir, { recursive: true });
    await buildPluginProject(plugin, context);
    expect(fs.readdirSync(plugin.stagingOutputDir)).toEqual(['index.cjs']);
    const pluginCode = fs.readFileSync(path.join(plugin.stagingOutputDir, 'index.cjs'), 'utf8');
    expect(pluginCode).toMatch(/canvas/);
    const exports = createRequire(import.meta.url)(path.join(plugin.stagingOutputDir, 'index.cjs')) as {
      info: { id: string };
      hasHttpClient: () => boolean;
      parsesBundledDependencySubpath: () => boolean;
    };
    expect(exports.info.id).toBe('build-fixture');
    expect(exports.hasHttpClient()).toBe(true);
    expect(exports.parsesBundledDependencySubpath()).toBe(true);
    expect(pluginCode).not.toMatch(/require\(["']zod\/v4["']\)/);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});
