/**
 * Rule: prefer-early-return
 * Section: 7.8 Early Return from Functions
 *
 * Detects deeply nested if statements that could use early returns
 * for better readability and performance.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer early returns over deeply nested conditionals',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      preferEarlyReturn:
        'Consider using an early return instead of nesting. Invert the condition and return early to reduce nesting depth.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxDepth: {
            type: 'integer',
            minimum: 1,
            default: 3,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const maxDepth = context.options[0]?.maxDepth ?? 3;

    function isReturnableBlock(node) {
      // Check if we're in a function body where early return is possible
      let current = node;
      while (current) {
        if (
          current.type === 'FunctionDeclaration' ||
          current.type === 'FunctionExpression' ||
          current.type === 'ArrowFunctionExpression'
        ) {
          return true;
        }
        current = current.parent;
      }
      return false;
    }

    function getIfDepth(node, currentDepth = 0) {
      if (node.type !== 'IfStatement') return currentDepth;

      // Check consequent for nested if
      const consequent = node.consequent;
      let maxConsequentDepth = currentDepth + 1;

      if (consequent.type === 'BlockStatement') {
        // Look for if statements in the block
        for (const stmt of consequent.body) {
          if (stmt.type === 'IfStatement') {
            const nestedDepth = getIfDepth(stmt, currentDepth + 1);
            maxConsequentDepth = Math.max(maxConsequentDepth, nestedDepth);
          }
        }
      } else if (consequent.type === 'IfStatement') {
        maxConsequentDepth = getIfDepth(consequent, currentDepth + 1);
      }

      return maxConsequentDepth;
    }

    function hasElseBranch(node) {
      return node.alternate !== null;
    }

    return {
      IfStatement(node) {
        // Only check top-level if statements (not already nested)
        if (node.parent.type === 'IfStatement') return;

        // Must be in a function where early return is possible
        if (!isReturnableBlock(node)) return;

        // Skip if-else-if chains (these are different patterns)
        if (hasElseBranch(node) && node.alternate?.type === 'IfStatement') {
          return;
        }

        const depth = getIfDepth(node);

        if (depth >= maxDepth) {
          context.report({
            node,
            messageId: 'preferEarlyReturn',
          });
        }
      },
    };
  },
};
