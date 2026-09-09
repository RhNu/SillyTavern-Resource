import { describe, expect, test } from 'vitest';
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

describe('parseManifest', () => {
  test('accepts a complete cache manifest', () => {
    expect(parseManifest(JSON.stringify(validManifest))).toEqual(validManifest);
  });

  test('rejects malformed or incomplete cache manifests', () => {
    expect(() => parseManifest('{')).toThrow(/Invalid cache manifest/);
    expect(() => parseManifest(JSON.stringify({ version: 2, projects: [] }))).toThrow(/Invalid cache manifest/);
    expect(() => parseManifest(JSON.stringify({ ...validManifest, version: 1 }))).toThrow(/Invalid cache manifest/);
  });
});
