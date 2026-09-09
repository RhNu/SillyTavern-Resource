import { defineConfig } from 'oxlint';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

const tailwindRules = {
  ...betterTailwindcss.configs['recommended-warn'].rules,
  ...betterTailwindcss.configs['recommended-error'].rules,
  'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
  'better-tailwindcss/no-unknown-classes': 'off',
} as const;

export default defineConfig({
  plugins: ['eslint', 'typescript', 'import', 'unicorn', 'react'],
  jsPlugins: ['eslint-plugin-better-tailwindcss'],
  settings: { 'better-tailwindcss': { entryPoint: 'tailwind.css' } },
  ignorePatterns: ['dist/**', '.cache/**', 'node_modules/**', 'examples/**'],
  rules: {
    'handle-callback-err': 'off',
    'import/no-cycle': 'error',
    'no-dupe-class-members': 'off',
    'no-empty-function': 'off',
    'no-lonely-if': 'error',
    'no-redeclare': 'off',
    'no-shadow': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-var': 'error',
    'prefer-const': 'warn',
    'typescript/no-explicit-any': 'off',
    'typescript/no-unused-vars': 'off',
    yoda: 'error',
  },
  overrides: [
    {
      files: ['src/scripts/**/*.{js,jsx,ts,tsx}', 'util/**/*.{js,jsx,ts,tsx}'],
      rules: tailwindRules,
    },
    {
      files: ['tools/**/*.ts', 'postcss.config.ts', 'src/plugins/**/*.ts'],
      env: { node: true },
      rules: { 'import/no-nodejs-modules': 'off' },
    },
  ],
});
