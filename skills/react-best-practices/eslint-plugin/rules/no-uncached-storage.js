/**
 * Rule: no-uncached-storage
 * Section: 7.5 Cache Storage API Calls
 *
 * Detects repeated localStorage/sessionStorage calls that should be cached.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Cache localStorage/sessionStorage reads for performance',
      category: 'Performance',
      recommended: true,
    },
    messages: {
      uncachedStorage:
        'Multiple {{storageType}}.{{method}}("{{key}}") calls detected. Cache the result in a variable or use a caching wrapper.',
      uncachedStorageGeneral:
        'Consider caching {{storageType}} reads in memory to avoid repeated synchronous I/O.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    // Track storage calls per scope: { scope -> { storageType:method:key -> [nodes] } }
    const storageCalls = new Map();

    function getCallsForScope(scope) {
      if (!storageCalls.has(scope)) {
        storageCalls.set(scope, new Map());
      }
      return storageCalls.get(scope);
    }

    function recordStorageCall(storageType, method, key, node) {
      const scope = sourceCode.getScope(node);
      const calls = getCallsForScope(scope);

      const callKey = `${storageType}:${method}:${key || 'dynamic'}`;
      if (!calls.has(callKey)) {
        calls.set(callKey, []);
      }
      calls.get(callKey).push({ node, storageType, method, key });
    }

    function checkAndReport(scope) {
      const calls = storageCalls.get(scope);
      if (!calls) return;

      for (const [key, entries] of calls.entries()) {
        if (entries.length >= 2) {
          const { node, storageType, method, key: storageKey } = entries[0];

          if (storageKey) {
            context.report({
              node,
              messageId: 'uncachedStorage',
              data: {
                storageType,
                method,
                key: storageKey,
              },
            });
          } else {
            context.report({
              node,
              messageId: 'uncachedStorageGeneral',
              data: { storageType },
            });
          }
        }
      }
    }

    const storageMethods = ['getItem', 'setItem', 'removeItem'];
    const storageObjects = ['localStorage', 'sessionStorage'];

    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') return;

        const obj = node.callee.object;
        const prop = node.callee.property;

        // Check for localStorage.getItem() etc.
        if (obj.type === 'Identifier' && storageObjects.includes(obj.name)) {
          const storageType = obj.name;
          const method = prop.name;

          if (storageMethods.includes(method) && node.arguments.length > 0) {
            // Try to get the key if it's a string literal
            const keyArg = node.arguments[0];
            const key = keyArg.type === 'Literal' ? keyArg.value : null;

            recordStorageCall(storageType, method, key, node);
          }
        }
      },

      'FunctionDeclaration:exit'(node) {
        const scope = sourceCode.getScope(node);
        checkAndReport(scope);
        storageCalls.delete(scope);
      },

      'FunctionExpression:exit'(node) {
        const scope = sourceCode.getScope(node);
        checkAndReport(scope);
        storageCalls.delete(scope);
      },

      'ArrowFunctionExpression:exit'(node) {
        const scope = sourceCode.getScope(node);
        checkAndReport(scope);
        storageCalls.delete(scope);
      },

      'Program:exit'(node) {
        const scope = sourceCode.getScope(node);
        checkAndReport(scope);
      },
    };
  },
};
