const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
    },
    rules: {
      'quotes': ['warn', 'single'],
      'indent': ['warn', 2, { 'SwitchCase': 1 }],
      'semi': ['off'],
      'comma-dangle': ['warn', 'always-multiline'],
      'dot-notation': 'off',
      'eqeqeq': 'warn',
      'curly': ['warn', 'all'],
      'brace-style': ['warn'],
      'prefer-arrow-callback': ['warn'],
      'max-len': ['warn', 140],
      'no-console': ['warn'], // use the provided Homebridge log method instead
      'comma-spacing': ['error'],
      'no-multi-spaces': ['warn', { 'ignoreEOLComments': true }],
      'no-trailing-spaces': ['warn'],
      'lines-between-class-members': ['warn', 'always', { 'exceptAfterSingleLine': true }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    ignores: ['dist/**/*'],
  },
];
