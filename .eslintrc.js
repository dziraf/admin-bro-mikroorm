module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'airbnb',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
  ],
  rules: {
    'class-methods-use-this': 'off',
    'no-shadow': 'off',
    'linebreak-style': 'off',
    'no-unused-vars': 'off',
    'max-len': ['error', 120],
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'react/jsx-filename-extension': 'off',
    'no-param-reassign': 'off',
    indent: [
      'error',
      2,
    ],
    'object-curly-newline': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  overrides: [{
    files: ['*.tsx'],
    rules: {
      'react/prop-types': 'off',
      'react/jsx-props-no-spreading': 'off',
    },
  }],
};
