/**
 * Rule: no-multiple-array-iterations
 * Section: 7.6 Combine Multiple Array Iterations
 *
 * Detects multiple .filter() or .map() calls on the same array
 * that could be combined into a single loop.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid multiple iterations over the same array',
      category: 'Performance',
      recommended: true,
    },
    messages: {
      multipleIterations:
        'Multiple {{method}}() calls on "{{arrayName}}" iterate the array {{count}} times. Consider combining into a single loop.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          minIterations: {
            type: 'integer',
            minimum: 2,
            default: 3,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const minIterations = context.options[0]?.minIterations ?? 3;

    // Track array iterations per scope
    const scopeIterations = new Map();

    function getCurrentScope() {
      return context.getScope();
    }

    function getIterationsForScope(scope) {
      if (!scopeIterations.has(scope)) {
        scopeIterations.set(scope, new Map());
      }
      return scopeIterations.get(scope);
    }

    function recordIteration(arrayName, method, node) {
      const scope = getCurrentScope();
      const iterations = getIterationsForScope(scope);

      const key = `${arrayName}:${method}`;
      if (!iterations.has(key)) {
        iterations.set(key, []);
      }
      iterations.get(key).push(node);
    }

    function checkAndReport(scope) {
      const iterations = scopeIterations.get(scope);
      if (!iterations) return;

      for (const [key, nodes] of iterations.entries()) {
        if (nodes.length >= minIterations) {
          const [arrayName, method] = key.split(':');
          context.report({
            node: nodes[0],
            messageId: 'multipleIterations',
            data: {
              arrayName,
              method,
              count: nodes.length,
            },
          });
        }
      }
    }

    const iterationMethods = ['filter', 'map', 'forEach', 'reduce', 'some', 'every'];

    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') return;

        const method = node.callee.property.name;
        if (!iterationMethods.includes(method)) return;

        // Get the array being iterated
        let arrayName = null;
        if (node.callee.object.type === 'Identifier') {
          arrayName = node.callee.object.name;
        }

        if (arrayName) {
          recordIteration(arrayName, method, node);
        }
      },

      'BlockStatement:exit'(node) {
        const scope = context.getScope();
        checkAndReport(scope);
        scopeIterations.delete(scope);
      },

      'Program:exit'(node) {
        const scope = context.getScope();
        checkAndReport(scope);
      },
    };
  },
};
