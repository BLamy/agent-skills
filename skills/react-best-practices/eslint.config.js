/**
 * ESLint Configuration for React Best Practices
 *
 * This configuration enforces rules from the React Best Practices guide
 * using both standard ESLint plugins and custom rules.
 *
 * See RULES-COVERAGE.md for details on which rules are covered.
 *
 * Usage:
 *   1. Install dependencies:
 *      npm install -D eslint @eslint/js @typescript-eslint/eslint-plugin \
 *        @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks \
 *        eslint-plugin-import
 *
 *   2. Copy this file and the eslint-plugin directory to your project
 *
 *   3. Run: npx eslint .
 */

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

// Custom plugin for React Best Practices
import reactBestPracticesPlugin from './eslint-plugin/index.js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'import': importPlugin,
      'react-best-practices': reactBestPracticesPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // ============================================================
      // CUSTOM PLUGIN RULES: react-best-practices
      // ============================================================

      // Section 1: Eliminating Waterfalls (CRITICAL)
      'react-best-practices/no-sequential-await': 'warn',
      'react-best-practices/no-await-before-condition': 'warn',

      // Section 2: Bundle Size Optimization (CRITICAL)
      'react-best-practices/prefer-dynamic-import': 'warn',

      // Section 3: Server-Side Performance (HIGH)
      'react-best-practices/no-object-spread-in-jsx-prop': 'off', // Enable if using RSC

      // Section 5: Re-render Optimization (MEDIUM)
      'react-best-practices/prefer-lazy-state-init': 'warn',
      'react-best-practices/prefer-functional-setstate': 'warn',
      'react-best-practices/prefer-narrow-dependencies': 'warn',

      // Section 6: Rendering Performance (MEDIUM)
      'react-best-practices/no-falsy-and-operator': 'error',

      // Section 7: JavaScript Performance (LOW-MEDIUM)
      'react-best-practices/no-array-find-in-loop': 'warn',
      'react-best-practices/no-includes-in-loop': 'warn',
      'react-best-practices/no-multiple-array-iterations': 'off', // Can be noisy
      'react-best-practices/no-uncached-storage': 'warn',
      'react-best-practices/prefer-tosorted': 'error',
      'react-best-practices/no-regexp-in-render': 'warn',
      'react-best-practices/no-sort-for-minmax': 'warn',

      // ============================================================
      // BUILT-IN RULES: Bundle Size Optimization
      // ============================================================

      // Rule 2.1: Avoid Barrel File Imports (bundle-barrel-imports)
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['lucide-react'],
            message: 'Import directly from lucide-react/dist/esm/icons/* to reduce bundle size.',
          },
          {
            group: ['@mui/material', '!@mui/material/*'],
            message: 'Import directly from @mui/material/*. Example: import Button from "@mui/material/Button"',
          },
          {
            group: ['@mui/icons-material', '!@mui/icons-material/*'],
            message: 'Import directly from @mui/icons-material/*.',
          },
          {
            group: ['lodash', '!lodash/*', '!lodash-es', '!lodash-es/*'],
            message: 'Import directly from lodash/* or use lodash-es.',
          },
          {
            group: ['date-fns', '!date-fns/*'],
            message: 'Import directly from date-fns/*.',
          },
          {
            group: ['react-icons', '!react-icons/*'],
            message: 'Import from specific icon set: react-icons/fa, react-icons/fi, etc.',
          },
        ],
      }],

      // ============================================================
      // REACT HOOKS RULES
      // ============================================================

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ============================================================
      // IMPORT ORGANIZATION
      // ============================================================

      'import/order': ['warn', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      }],

      // ============================================================
      // GENERAL BEST PRACTICES
      // ============================================================

      'prefer-const': 'warn',
      'no-var': 'error',

      // React rules
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-children-prop': 'warn',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'warn',

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
    ],
  },
];
