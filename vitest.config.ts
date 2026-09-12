import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const unitTestFiles = [
  'tools/**/*.test.ts',
  'util/**/*.test.ts',
  'src/shared/**/*.test.ts',
  'src/plugins/**/*.test.ts',
  'src/scripts/**/*.test.ts',
];

export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@util': fileURLToPath(new URL('./util', import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: unitTestFiles,
          exclude: ['**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['**/*.integration.test.ts'],
          fileParallelism: false,
          hookTimeout: 30_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
