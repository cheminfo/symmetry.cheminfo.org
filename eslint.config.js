import { defineConfig, globalIgnores } from 'eslint/config';
import { globals } from 'eslint-config-zakodium';
import react from 'eslint-config-zakodium/react';
import ts from 'eslint-config-zakodium/ts';
import unicorn from 'eslint-config-zakodium/unicorn';

export default defineConfig(
  globalIgnores(['coverage', 'dist', 'playwright-report', 'test-results']),
  ts,
  unicorn,
  react,
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'scripts/**'],
    languageOptions: { globals: { ...globals.nodeBuiltin } },
  },
  {
    files: ['src/**/*.tsx'],
    extends: [react],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@blueprintjs/core',
              importNames: ['Popover'],
              message:
                'Blueprint’s legacy Popover does not position itself under React 19: use PopoverNext.',
            },
          ],
        },
      ],
    },
  },
  {
    // molstar has no exports map: every import is a deep, de-facto private path
    // with no stability contract, and `nodenext` resolution needs the `.js`
    // suffix that Vite does not. Confining it to one folder keeps a major bump
    // to a handful of files.
    files: ['src/**'],
    ignores: ['src/viewer/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['molstar', 'molstar/*'],
              message:
                'Only src/viewer may import molstar. Expose what you need through src/viewer instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // The body of `signatureOf` runs inside `page.evaluate`, so its
    // `createImageBitmap` is the browser's, not Node's.
    files: ['e2e/canvasSignature.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    // The group theory is the part that has to be right, so it stays runnable
    // in plain Node: vitest covers it without a DOM, a GPU or a mock.
    files: ['src/symmetry/**', 'src/crystal/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'molstar', 'molstar/*'],
              message:
                'src/symmetry and src/crystal are pure domain logic: no React, no molstar.',
            },
          ],
        },
      ],
    },
  },
);
