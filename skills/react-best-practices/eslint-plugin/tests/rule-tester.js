/**
 * ESLint RuleTester wrapper for vitest
 */
import { RuleTester } from 'eslint';

// Configure RuleTester for modern JavaScript and JSX
export const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});
