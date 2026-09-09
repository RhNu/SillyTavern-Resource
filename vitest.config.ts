import { defineConfig } from 'vitest/config';

const unitTestFiles = ['tools/**/*.test.ts', 'src/plugins/**/*.test.ts', 'src/scripts/**/*.test.ts'];

export default defineConfig({
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
