/**
 * Rule: no-nested-ternary-in-jsx
 * Section: 6.7 Use Explicit Conditional Rendering (extended)
 *
 * Detects nested ternary operators in JSX which hurt readability.
 * Suggests extracting to separate components or using early returns.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid nested ternary operators in JSX',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noNestedTernary:
        'Nested ternary in JSX reduces readability. Extract to a variable, use if/else, or split into components.',
    },
    schema: [],
  },

  create(context) {
    function isInsideJSX(node) {
      let current = node.parent;
      while (current) {
        if (
          current.type === 'JSXExpressionContainer' ||
          current.type === 'JSXElement' ||
          current.type === 'JSXFragment'
        ) {
          return true;
        }
        current = current.parent;
      }
      return false;
    }

    function isNestedTernary(node) {
      // Check if this ternary contains another ternary in consequent or alternate
      const { consequent, alternate } = node;

      if (consequent.type === 'ConditionalExpression') return true;
      if (alternate.type === 'ConditionalExpression') return true;

      return false;
    }

    return {
      ConditionalExpression(node) {
        // Only check if inside JSX
        if (!isInsideJSX(node)) return;

        // Check if this is a nested ternary
        if (isNestedTernary(node)) {
          context.report({
            node,
            messageId: 'noNestedTernary',
          });
        }
      },
    };
  },
};
