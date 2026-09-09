import assert from 'node:assert/strict';
import test from 'node:test';
import { parseManifest } from './cache.ts';

const validManifest = {
  version: 2,
  projects: {
    'scripts/example': {
      projectKey: 'scripts/example',
      kind: 'script',
      mode: 'production',
      inputHash: 'hash',
      outputDir: 'scripts/example',
      outputFiles: ['index.js'],
      builtAt: '2026-09-09T00:00:00.000Z',
    },
  },
} as const;

test('accepts a complete cache manifest', () => {
  assert.deepEqual(parseManifest(JSON.stringify(validManifest)), validManifest);
});

test('rejects malformed or incomplete cache manifests', () => {
  assert.throws(() => parseManifest('{'), /Invalid cache manifest/);
  assert.throws(() => parseManifest(JSON.stringify({ version: 2, projects: [] })), /Invalid cache manifest/);
  assert.throws(() => parseManifest(JSON.stringify({ ...validManifest, version: 1 })), /Invalid cache manifest/);
});
