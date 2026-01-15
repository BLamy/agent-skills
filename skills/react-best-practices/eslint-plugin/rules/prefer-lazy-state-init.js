/**
 * Rule: prefer-lazy-state-init
 * Section: 5.6 Use Lazy State Initialization
 *
 * Detects useState calls with function invocations instead of function references.
 * useState(expensiveFn()) runs on every render, useState(() => expensiveFn()) runs once.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer lazy initialization for useState with function calls',
      category: 'Performance',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      preferLazyInit:
        'useState with a function call runs on every render. Use lazy initialization: useState(() => {{ return {{{call}}} }})',
      preferLazyInitSimple:
        'useState with a function call runs on every render. Use lazy initialization: useState(() => expensiveFn())',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoredFunctions: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    const ignoredFunctions = new Set(context.options[0]?.ignoredFunctions ?? []);

    // Common cheap functions that don't need lazy init
    const cheapFunctions = new Set([
      'Boolean',
      'Number',
      'String',
      'Array',
      'Object',
      'Date.now',
    ]);

    function isUseStateCall(node) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'useState'
      );
    }

    function getFunctionName(node) {
      if (node.type === 'Identifier') {
        return node.name;
      }
      if (node.type === 'MemberExpression') {
        const obj = node.object.name || '';
        const prop = node.property.name || '';
        return `${obj}.${prop}`;
      }
      return null;
    }

    function isExpensiveCall(node) {
      if (node.type !== 'CallExpression') return false;

      const funcName = getFunctionName(node.callee);

      // Skip ignored or cheap functions
      if (funcName && (ignoredFunctions.has(funcName) || cheapFunctions.has(funcName))) {
        return false;
      }

      // Skip simple constructors with no args
      if (
        node.callee.type === 'Identifier' &&
        /^[A-Z]/.test(node.callee.name) &&
        node.arguments.length === 0
      ) {
        return false;
      }

      return true;
    }

    return {
      CallExpression(node) {
        if (!isUseStateCall(node)) return;
        if (node.arguments.length === 0) return;

        const initialValue = node.arguments[0];

        // Check if it's a function call (not an arrow function or function reference)
        if (isExpensiveCall(initialValue)) {
          const callText = sourceCode.getText(initialValue);

          context.report({
            node: initialValue,
            messageId: 'preferLazyInitSimple',
            fix(fixer) {
              return fixer.replaceText(initialValue, `() => ${callText}`);
            },
          });
        }

        // Check for new expressions like new Map(), new Set()
        if (initialValue.type === 'NewExpression') {
          // Skip simple constructors
          if (
            initialValue.callee.type === 'Identifier' &&
            ['Map', 'Set', 'WeakMap', 'WeakSet', 'Array', 'Object'].includes(
              initialValue.callee.name
            ) &&
            initialValue.arguments.length === 0
          ) {
            return;
          }

          const callText = sourceCode.getText(initialValue);

          context.report({
            node: initialValue,
            messageId: 'preferLazyInitSimple',
            fix(fixer) {
              return fixer.replaceText(initialValue, `() => ${callText}`);
            },
          });
        }

        // Check for JSON.parse, localStorage.getItem, etc.
        if (
          initialValue.type === 'CallExpression' &&
          initialValue.callee.type === 'MemberExpression'
        ) {
          const objName = initialValue.callee.object.name;
          const propName = initialValue.callee.property.name;

          // Known expensive operations
          const expensiveOps = [
            ['JSON', 'parse'],
            ['localStorage', 'getItem'],
            ['sessionStorage', 'getItem'],
            ['document', 'querySelector'],
            ['document', 'querySelectorAll'],
            ['document', 'getElementById'],
          ];

          const isExpensive = expensiveOps.some(
            ([obj, prop]) => objName === obj && propName === prop
          );

          if (isExpensive) {
            const callText = sourceCode.getText(initialValue);

            context.report({
              node: initialValue,
              messageId: 'preferLazyInitSimple',
              fix(fixer) {
                return fixer.replaceText(initialValue, `() => ${callText}`);
              },
            });
          }
        }
      },
    };
  },
};
