import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
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
    assert.match(html, /frontend-ready/);
    assert.deepEqual(fs.readdirSync(frontend.stagingOutputDir), ['index.html']);

    const script = project('script', 'script', 'index.ts');
    fs.mkdirSync(script.stagingOutputDir, { recursive: true });
    await buildBrowserProject(script, context);
    removeEmptyDirectories(script.stagingOutputDir);
    const javascript = fs.readFileSync(path.join(script.stagingOutputDir, 'index.js'), 'utf8');
    assert.match(javascript, /https:\/\/testingcf\.jsdelivr\.net\/npm\/lodash\/\+esm/);
    assert.match(javascript, /data-bundled-style/);
    assert.deepEqual(fs.readdirSync(script.stagingOutputDir), ['index.js']);

    const plugin = project('plugin', 'plugin', 'index.ts');
    fs.mkdirSync(plugin.stagingOutputDir, { recursive: true });
    await buildPluginProject(plugin, context);
    assert.deepEqual(fs.readdirSync(plugin.stagingOutputDir), ['index.cjs']);
    const pluginCode = fs.readFileSync(path.join(plugin.stagingOutputDir, 'index.cjs'), 'utf8');
    assert.match(pluginCode, /canvas/);
    const exports = createRequire(import.meta.url)(path.join(plugin.stagingOutputDir, 'index.cjs')) as {
      info: { id: string };
      hasHttpClient: () => boolean;
    };
    assert.equal(exports.info.id, 'build-fixture');
    assert.equal(exports.hasHttpClient(), true);
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }
});
