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
    fixable: 'code',
    messages: {
      cacheLengthInLoop:
        'Array length "{{expression}}" is accessed in loop condition. Consider caching: const {{varName}} = {{expression}}',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.getSourceCode();

    /**
     * Gets the statement that contains the for loop (to insert before it)
     */
    function getContainingStatement(node) {
      let current = node;
      while (current.parent) {
        if (
          current.parent.type === 'Program' ||
          current.parent.type === 'BlockStatement'
        ) {
          return current;
        }
        current = current.parent;
      }
      return current;
    }

    /**
     * Generate a variable name for caching the length
     */
    function generateVarName(arrayName) {
      return `${arrayName}Len`;
    }

    return {
      ForStatement(node) {
        // Check the test condition for .length access
        const test = node.test;
        if (!test) return;

        // Look for comparisons like: i < arr.length, i <= arr.length
        if (test.type === 'BinaryExpression') {
          const { left, right } = test;

          // Check right side for .length (most common: i < arr.length)
          if (
            right.type === 'MemberExpression' &&
            right.property.type === 'Identifier' &&
            right.property.name === 'length' &&
            right.object.type === 'Identifier'
          ) {
            const arrayName = right.object.name;
            const expression = sourceCode.getText(right);
            const varName = generateVarName(arrayName);

            context.report({
              node: right,
              messageId: 'cacheLengthInLoop',
              data: { expression, varName },
              fix(fixer) {
                const containingStatement = getContainingStatement(node);
                const declaration = `const ${varName} = ${expression};\n`;

                return [
                  fixer.insertTextBefore(containingStatement, declaration),
                  fixer.replaceText(right, varName),
                ];
              },
            });
          }

          // Check left side for .length (less common: arr.length > i)
          if (
            left.type === 'MemberExpression' &&
            left.property.type === 'Identifier' &&
            left.property.name === 'length' &&
            left.object.type === 'Identifier'
          ) {
            const arrayName = left.object.name;
            const expression = sourceCode.getText(left);
            const varName = generateVarName(arrayName);

            context.report({
              node: left,
              messageId: 'cacheLengthInLoop',
              data: { expression, varName },
              fix(fixer) {
                const containingStatement = getContainingStatement(node);
                const declaration = `const ${varName} = ${expression};\n`;

                return [
                  fixer.insertTextBefore(containingStatement, declaration),
                  fixer.replaceText(left, varName),
                ];
              },
            });
          }
        }
      },
    };
  },
};
