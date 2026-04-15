import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import importx from 'eslint-plugin-import-x';
import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  importx.flatConfigs.recommended,
  importx.flatConfigs.typescript,
  {
    files: ['src/**/*.{html,js,jsx,ts,tsx}', 'util/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs['recommended-warn'].rules,
      ...eslintPluginBetterTailwindcss.configs['recommended-error'].rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': ['off', { preferSingleLine: true, printWidth: 120 }],
      'better-tailwindcss/no-unregistered-classes': ['off', { ignore: ['fa-*'] }],
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'tailwind.css',
        tailwindConfig: 'tailwind.config.js',
      },
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'handle-callback-err': 'off',
      'import-x/no-console': 'off',
      'import-x/no-cycle': 'error',
      'import-x/no-dynamic-require': 'warn',
      'import-x/no-nodejs-modules': 'warn',
      'import-x/no-unresolved': [2, { ignore: ['^http'] }],
      'no-dupe-class-members': 'off',
      'no-empty-function': 'off',
      'no-floating-decimal': 'error',
      'no-lonely-if': 'error',
      'no-multi-spaces': 'error',
      'no-redeclare': 'off',
      'no-shadow': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-var': 'error',
      'prefer-const': 'warn',
      yoda: 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    rules: {
      'import-x/no-nodejs-modules': 'off',
    },
  },
  eslintConfigPrettier,
  globalIgnores([
    'dist/**',
    'node_modules/**',
    '示例/**',
    '初始模板/**',
    'eslint.config.mjs',
    'postcss.config.js',
    'dump_schema.ts',
    'tavern_sync.mjs',
  ]),
];
