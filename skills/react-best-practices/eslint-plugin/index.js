/**
 * ESLint Plugin: react-best-practices
 *
 * Custom ESLint rules for React performance optimization based on
 * the React Best Practices guide.
 *
 * Usage:
 *   import reactBestPractices from './eslint-plugin';
 *
 *   export default [
 *     {
 *       plugins: { 'react-best-practices': reactBestPractices },
 *       rules: {
 *         'react-best-practices/no-sequential-await': 'warn',
 *         // ... other rules
 *       }
 *     }
 *   ];
 */

const noSequentialAwait = require('./rules/no-sequential-await');
const preferLazyStateInit = require('./rules/prefer-lazy-state-init');
const preferFunctionalSetstate = require('./rules/prefer-functional-setstate');
const noArrayFindInLoop = require('./rules/no-array-find-in-loop');
const noIncludesInLoop = require('./rules/no-includes-in-loop');
const noMultipleArrayIterations = require('./rules/no-multiple-array-iterations');
const noUncachedStorage = require('./rules/no-uncached-storage');
const preferTosorted = require('./rules/prefer-tosorted');
const noRegexpInRender = require('./rules/no-regexp-in-render');
const noFalsyAndOperator = require('./rules/no-falsy-and-operator');
const noSortForMinmax = require('./rules/no-sort-for-minmax');
const noAwaitBeforeCondition = require('./rules/no-await-before-condition');
const preferDynamicImport = require('./rules/prefer-dynamic-import');
const preferNarrowDependencies = require('./rules/prefer-narrow-dependencies');
const noObjectSpreadInJsxProp = require('./rules/no-object-spread-in-jsx-prop');
const cacheLoopLength = require('./rules/cache-loop-length');
const preferEarlyReturn = require('./rules/prefer-early-return');
const noNestedTernaryInJsx = require('./rules/no-nested-ternary-in-jsx');
const preferLengthCheckFirst = require('./rules/prefer-length-check-first');
const preferTransitionForFrequentUpdates = require('./rules/prefer-transition-for-frequent-updates');
const preferStaticJsxOutside = require('./rules/prefer-static-jsx-outside');

const plugin = {
  meta: {
    name: 'eslint-plugin-react-best-practices',
    version: '1.0.0',
  },
  rules: {
    // Section 1: Eliminating Waterfalls
    'no-sequential-await': noSequentialAwait,
    'no-await-before-condition': noAwaitBeforeCondition,

    // Section 2: Bundle Size Optimization
    'prefer-dynamic-import': preferDynamicImport,

    // Section 3: Server-Side Performance
    'no-object-spread-in-jsx-prop': noObjectSpreadInJsxProp,

    // Section 5: Re-render Optimization
    'prefer-lazy-state-init': preferLazyStateInit,
    'prefer-functional-setstate': preferFunctionalSetstate,
    'prefer-narrow-dependencies': preferNarrowDependencies,
    'prefer-transition-for-frequent-updates': preferTransitionForFrequentUpdates,

    // Section 6: Rendering Performance
    'no-falsy-and-operator': noFalsyAndOperator,

    // Section 6: Rendering Performance (extended)
    'no-nested-ternary-in-jsx': noNestedTernaryInJsx,
    'prefer-static-jsx-outside': preferStaticJsxOutside,

    // Section 7: JavaScript Performance
    'no-array-find-in-loop': noArrayFindInLoop,
    'no-includes-in-loop': noIncludesInLoop,
    'no-multiple-array-iterations': noMultipleArrayIterations,
    'no-uncached-storage': noUncachedStorage,
    'prefer-tosorted': preferTosorted,
    'no-regexp-in-render': noRegexpInRender,
    'no-sort-for-minmax': noSortForMinmax,
    'cache-loop-length': cacheLoopLength,
    'prefer-early-return': preferEarlyReturn,
    'prefer-length-check-first': preferLengthCheckFirst,
  },
  configs: {
    recommended: {
      plugins: ['react-best-practices'],
      rules: {
        // Critical rules (errors)
        'react-best-practices/no-sequential-await': 'warn',
        'react-best-practices/prefer-dynamic-import': 'warn',
        'react-best-practices/prefer-tosorted': 'error',
        'react-best-practices/no-falsy-and-operator': 'error',

        // High impact rules (warnings)
        'react-best-practices/no-await-before-condition': 'warn',
        'react-best-practices/prefer-lazy-state-init': 'warn',
        'react-best-practices/prefer-functional-setstate': 'warn',
        'react-best-practices/no-array-find-in-loop': 'warn',
        'react-best-practices/no-includes-in-loop': 'warn',

        // Medium impact rules (warnings)
        'react-best-practices/prefer-narrow-dependencies': 'warn',
        'react-best-practices/no-regexp-in-render': 'warn',
        'react-best-practices/no-uncached-storage': 'warn',
        'react-best-practices/no-sort-for-minmax': 'warn',

        // Code quality rules
        'react-best-practices/no-nested-ternary-in-jsx': 'warn',
        'react-best-practices/prefer-early-return': 'warn',

        // Medium-high impact rules
        'react-best-practices/prefer-length-check-first': 'warn',
        'react-best-practices/prefer-transition-for-frequent-updates': 'warn',

        // Lower impact rules (off by default)
        'react-best-practices/no-multiple-array-iterations': 'off',
        'react-best-practices/no-object-spread-in-jsx-prop': 'off',
        'react-best-practices/cache-loop-length': 'off',
        'react-best-practices/prefer-static-jsx-outside': 'off', // React Compiler handles this
      },
    },
    strict: {
      plugins: ['react-best-practices'],
      rules: {
        'react-best-practices/no-sequential-await': 'error',
        'react-best-practices/no-await-before-condition': 'error',
        'react-best-practices/prefer-dynamic-import': 'error',
        'react-best-practices/no-object-spread-in-jsx-prop': 'warn',
        'react-best-practices/prefer-lazy-state-init': 'error',
        'react-best-practices/prefer-functional-setstate': 'error',
        'react-best-practices/prefer-narrow-dependencies': 'error',
        'react-best-practices/no-falsy-and-operator': 'error',
        'react-best-practices/no-array-find-in-loop': 'error',
        'react-best-practices/no-includes-in-loop': 'error',
        'react-best-practices/no-multiple-array-iterations': 'warn',
        'react-best-practices/no-uncached-storage': 'error',
        'react-best-practices/prefer-tosorted': 'error',
        'react-best-practices/no-regexp-in-render': 'error',
        'react-best-practices/no-sort-for-minmax': 'error',
        'react-best-practices/no-nested-ternary-in-jsx': 'error',
        'react-best-practices/prefer-early-return': 'error',
        'react-best-practices/cache-loop-length': 'warn',
        'react-best-practices/prefer-length-check-first': 'error',
        'react-best-practices/prefer-transition-for-frequent-updates': 'error',
        'react-best-practices/prefer-static-jsx-outside': 'warn',
      },
    },
  },
};

module.exports = plugin;
