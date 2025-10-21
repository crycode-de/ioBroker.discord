import { defineConfig } from 'eslint/config';

import crycode from '@crycode/eslint-config';

export default defineConfig(
  ...crycode.configs.ts,
  ...crycode.configs.stylistic,

  {
    ignores: [
      '.dev-server/',
      'build/',
      'test/',
    ],
  },

  {
    files: [
      'src/**/*',
    ],

    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: [
          './tsconfig.json',
        ],
      },
    },

  },

  {
    files: [
      'admin/blockly.js',
    ],

    languageOptions: {
      globals: {
        Blockly: 'readonly',
        document: 'readonly',
        goog: 'readonly',
        main: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',
      },
    },

    rules: {
      '@stylistic/operator-linebreak': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'no-console': 'off',
    },
  },
);
