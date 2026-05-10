import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['node_modules/**', 'dist/**'],
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        document: 'readonly',
        localStorage: 'readonly',
        window: 'readonly',
        import: 'readonly'
      }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': 'off'
    }
  }
];
