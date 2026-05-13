// ESLint flat config — https://eslint.org/docs/latest/use/configure/configuration-files
//
// One file replaces the old .eslintrc.json + .eslintignore pair. Each entry in
// the exported array is a config block; later blocks override earlier ones for
// matching files. Run `npm run lint` to apply.

'use strict';

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Global ignores — applies to every other block. Anything matched here is
  // never read by ESLint.
  {
    ignores: ['node_modules/', 'coverage/', 'dist/'],
  },

  // eslint:recommended ports — the curated set of rules the ESLint team
  // considers safe defaults (no-unused-vars, no-undef, no-unreachable, etc.).
  js.configs.recommended,

  // Project source — runs against everything not excluded above.
  {
    files: ['**/*.js'],
    languageOptions: {
      // Match Node 18+ language features (matches the CI test matrix floor
      // and the `engines` field in package.json).
      ecmaVersion: 2022,
      // index.js uses `require`/`module.exports`; flat config defaults to ESM,
      // so we set this explicitly to avoid false "import/export" parse errors.
      sourceType: 'commonjs',
      // Provides `process`, `require`, `module`, `__dirname`, etc. as known
      // globals so no-undef doesn't trip on them.
      globals: { ...globals.node },
    },
    rules: {
      // Code style: const/let only, no var. The legacy config already enforced these.
      'no-var': 'error',
      'prefer-const': 'warn',

      // Catch == / != bugs early — config files often have stringly-typed values.
      eqeqeq: ['error', 'always'],

      // Tolerate intentionally-unused args/vars/catch-bindings when prefixed
      // with `_` (common pattern for callback signatures and ignored errors).
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },

  // Test files get the Jest globals (describe/test/expect/beforeEach/...).
  {
    files: ['test/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
