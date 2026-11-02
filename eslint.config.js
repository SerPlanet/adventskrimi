import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'adventskrimi/**',
      'supabase/.temp/**',
      'supabase/functions/_shared/engine.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
      },
    },
  },
);
