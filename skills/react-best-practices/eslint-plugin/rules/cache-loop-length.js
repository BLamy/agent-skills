/**
 * Rule: cache-loop-length
 * Section: 7.3 Cache Property Access in Loops
 *
 * Detects .length access in for loop conditions that could be cached.
 * Modern engines optimize this, but caching can still help with readability
 * and prevents issues if the array is modified during iteration.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Cache array length in for loop conditions',
      category: 'Performance',
      recommended: false, // Off by default since modern engines optimize this
    },
    messages: {
      cacheLengthInLoop:
        'Array length "{{expression}}" is accessed in loop condition. Consider caching: const len = {{expression}}',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.getSourceCode();

    return {
      ForStatement(node) {
        // Check the test condition for .length access
        const test = node.test;
        if (!test) return;

        // Look for comparisons like: i < arr.length, i <= arr.length
        if (test.type === 'BinaryExpression') {
          const { left, right } = test;

          // Check right side for .length
          if (
            right.type === 'MemberExpression' &&
            right.property.type === 'Identifier' &&
            right.property.name === 'length'
          ) {
            const expression = sourceCode.getText(right);
            context.report({
              node: right,
              messageId: 'cacheLengthInLoop',
              data: { expression },
            });
          }

          // Check left side for .length (less common but possible)
          if (
            left.type === 'MemberExpression' &&
            left.property.type === 'Identifier' &&
            left.property.name === 'length'
          ) {
            const expression = sourceCode.getText(left);
            context.report({
              node: left,
              messageId: 'cacheLengthInLoop',
              data: { expression },
            });
          }
        }
      },
    };
  },
};
