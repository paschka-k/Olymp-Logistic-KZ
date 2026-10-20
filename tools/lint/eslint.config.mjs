// FR-204 · ESLint for platform-src (flat config). The v6 sources are classic scripts that build-v6.mjs concatenates into ONE
// <script> per language, so cross-file globals are normal: no-undef / no-unused-vars stay off here; the bundle-level check
// (duplicate top-level names, wall clock) lives in the test suite (tests/f0-ci-infra.js, tests/g4-architecture.js).
import js from '@eslint/js';
import globals from 'globals';

const core = {
  ...js.configs.recommended.rules,
  'no-undef': 'off',
  'no-unused-vars': 'off',
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-cond-assign': ['error', 'except-parens'],
  'no-control-regex': 'off',
  'no-misleading-character-class': 'off',
  'no-useless-escape': 'off',
  'no-prototype-builtins': 'off',
  'no-sparse-arrays': 'off',
  'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true, skipRegExps: true, skipComments: true }],
  // FR-206: only CLOCK (v6/data.js) may read the wall clock
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
      message: 'Use clockNow() (FR-206): only CLOCK in v6/data.js reads the wall clock.',
    },
  ],
};
export default [
  { ignores: ['**/node_modules/**', '**/vendor/**', '**/*.min.js', 'platform-src/lang/**', 'platform-src/shared/**', '**/parity-039/**'] },
  {
    files: ['**/platform-src/v6/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser } },
    rules: core,
  },
  { files: ['**/platform-src/v6/data.js'], rules: { 'no-restricted-syntax': 'off' } },
  {
    files: ['**/platform-src/tests/*.js'],
    // suite files are bodies of one async function in tests/template.html (top-level await, shared helpers)
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } },
    rules: { ...core, 'no-restricted-syntax': 'off', 'no-constant-condition': 'off' },
  },
  {
    files: ['**/*.mjs', '**/*.cjs', '**/tools/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
    rules: { ...core, 'no-restricted-syntax': 'off' },
  },
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs' } },
];
