module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    // Disable fast-refresh export-only rule to allow contexts/util exports without warnings
    'react-refresh/only-export-components': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.*', '**/__tests__/**/*.*'],
      env: {
        jest: true,
      },
      globals: {
        vi: 'readonly',
      },
    },
  ],
}
