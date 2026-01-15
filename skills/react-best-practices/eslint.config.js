/**
 * ESLint Configuration for React Best Practices
 *
 * This configuration enforces rules from the React Best Practices guide.
 * See RULES-COVERAGE.md for details on which rules are/aren't covered.
 *
 * Usage:
 *   1. Install dependencies:
 *      npm install -D eslint @eslint/js @typescript-eslint/eslint-plugin \
 *        @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks \
 *        eslint-plugin-import
 *
 *   2. Copy this file to your project root
 *
 *   3. Run: npx eslint .
 */

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

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
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // ============================================================
      // SECTION 2: Bundle Size Optimization
      // ============================================================

      // Rule 2.1: Avoid Barrel File Imports (bundle-barrel-imports)
      // Warns against importing from barrel files of common large libraries
      'no-restricted-imports': ['error', {
        patterns: [
          // lucide-react - import directly from icon files
          {
            group: ['lucide-react'],
            message: 'Import directly from lucide-react/dist/esm/icons/* instead to reduce bundle size. Example: import Check from "lucide-react/dist/esm/icons/check"',
          },
          // @mui/material - import directly from component files
          {
            group: ['@mui/material', '!@mui/material/*'],
            message: 'Import directly from @mui/material/* instead. Example: import Button from "@mui/material/Button"',
          },
          // @mui/icons-material - import directly from icon files
          {
            group: ['@mui/icons-material', '!@mui/icons-material/*'],
            message: 'Import directly from @mui/icons-material/* instead. Example: import Add from "@mui/icons-material/Add"',
          },
          // lodash - use lodash-es or direct imports
          {
            group: ['lodash', '!lodash/*', '!lodash-es', '!lodash-es/*'],
            message: 'Import directly from lodash/* or use lodash-es. Example: import debounce from "lodash/debounce"',
          },
          // date-fns - import directly
          {
            group: ['date-fns', '!date-fns/*'],
            message: 'Import directly from date-fns/*. Example: import { format } from "date-fns/format"',
          },
          // react-icons - import from specific icon set
          {
            group: ['react-icons', '!react-icons/*'],
            message: 'Import from specific icon set. Example: import { FaGithub } from "react-icons/fa"',
          },
        ],
      }],

      // ============================================================
      // SECTION 5: Re-render Optimization
      // ============================================================

      // Rule 5.3: Narrow Effect Dependencies (rerender-dependencies)
      // Rule 5.5: Use Functional setState Updates (rerender-functional-setstate)
      // Enforced via react-hooks/exhaustive-deps
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ============================================================
      // SECTION 6: Rendering Performance
      // ============================================================

      // Rule 6.7: Use Explicit Conditional Rendering (rendering-conditional-render)
      // Warns against && with numbers that might render 0
      'no-restricted-syntax': ['warn',
        {
          selector: 'JSXExpressionContainer > LogicalExpression[operator="&&"][left.type="Identifier"]',
          message: 'Avoid using && for conditional rendering with variables that might be 0 or NaN. Use ternary operator: condition ? <Component /> : null',
        },
        {
          selector: 'JSXExpressionContainer > LogicalExpression[operator="&&"][left.type="MemberExpression"]',
          message: 'Avoid using && for conditional rendering with properties that might be 0 or NaN. Use explicit boolean check: count > 0 ? <Component /> : null',
        },
        // Rule 7.9: Hoist RegExp Creation (js-hoist-regexp)
        // Warns against creating RegExp inside JSX or render functions
        {
          selector: 'JSXElement NewExpression[callee.name="RegExp"]',
          message: 'Move RegExp creation outside of JSX. Hoist to module scope or memoize with useMemo.',
        },
        {
          selector: 'ArrowFunctionExpression > BlockStatement NewExpression[callee.name="RegExp"]',
          message: 'Consider hoisting RegExp to module scope or memoizing with useMemo if this is in a component.',
        },
        // Rule 7.12: Use toSorted() Instead of sort() for Immutability (js-tosorted-immutable)
        // Warns against using .sort() which mutates arrays
        {
          selector: 'CallExpression[callee.property.name="sort"]',
          message: 'Array.sort() mutates the original array. Use .toSorted() for immutable sorting, or [...array].sort() for older browsers.',
        },
      ],

      // ============================================================
      // SECTION 7: JavaScript Performance
      // ============================================================

      // Additional import organization rules
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

      // Prefer const over let when variable is never reassigned
      'prefer-const': 'warn',

      // Disallow var, prefer const/let
      'no-var': 'error',

      // ============================================================
      // General React Best Practices
      // ============================================================

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

      // TypeScript-specific rules that help with performance
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
