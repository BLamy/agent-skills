/**
 * Rule: no-sort-for-minmax
 * Section: 7.10 Use Loop for Min/Max Instead of Sort
 *
 * Detects sorting followed by [0] or [length-1] access to find min/max.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use loop for min/max instead of sorting',
      category: 'Performance',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      sortForMinMax:
        'Sorting to find {{which}} is O(n log n). Use a single loop O(n) or Math.{{method}}() instead.',
    },
    schema: [],
  },

  create(context) {
    /**
     * Analyzes a sort comparator to determine if it's ascending or descending
     * Returns 'asc', 'desc', or null if can't determine
     */
    function analyzeSortDirection(sortCall) {
      const comparator = sortCall.arguments[0];
      if (!comparator) return null;

      // Handle arrow functions: (a, b) => a - b or (a, b) => b - a
      if (comparator.type === 'ArrowFunctionExpression' && comparator.params.length >= 2) {
        const body = comparator.body;
        const paramA = comparator.params[0].name;
        const paramB = comparator.params[1].name;

        if (body.type === 'BinaryExpression' && body.operator === '-') {
          const { left, right } = body;
          // (a, b) => a - b is ascending
          if (left.type === 'Identifier' && left.name === paramA &&
              right.type === 'Identifier' && right.name === paramB) {
            return 'asc';
          }
          // (a, b) => b - a is descending
          if (left.type === 'Identifier' && left.name === paramB &&
              right.type === 'Identifier' && right.name === paramA) {
            return 'desc';
          }
        }
      }

      return null;
    }

    /**
     * Gets the array being sorted
     */
    function getArrayName(sortCall) {
      if (sortCall.callee.type === 'MemberExpression' &&
          sortCall.callee.object.type === 'Identifier') {
        return sortCall.callee.object.name;
      }
      return null;
    }

    return {
      // Detect patterns like: arr.sort(...)[0] or arr.toSorted(...)[0]
      MemberExpression(node) {
        // Check if accessing [0] or [arr.length - 1]
        if (node.computed !== true) return;

        const property = node.property;
        let isAccessingFirst = false;
        let isAccessingLast = false;

        // Check for [0]
        if (property.type === 'Literal' && property.value === 0) {
          isAccessingFirst = true;
        }

        // Check for [arr.length - 1] pattern
        if (
          property.type === 'BinaryExpression' &&
          property.operator === '-' &&
          property.right.type === 'Literal' &&
          property.right.value === 1
        ) {
          isAccessingLast = true;
        }

        if (!isAccessingFirst && !isAccessingLast) return;

        // Check if the object is a sort/toSorted call
        const obj = node.object;
        if (obj.type !== 'CallExpression') return;
        if (obj.callee.type !== 'MemberExpression') return;

        const methodName = obj.callee.property.name;
        if (methodName !== 'sort' && methodName !== 'toSorted') return;

        const which = isAccessingFirst ? 'minimum/first' : 'maximum/last';
        const direction = analyzeSortDirection(obj);
        const arrayName = getArrayName(obj);

        // Determine the correct Math method based on direction and position
        let mathMethod = null;
        if (direction === 'asc') {
          mathMethod = isAccessingFirst ? 'min' : 'max';
        } else if (direction === 'desc') {
          mathMethod = isAccessingFirst ? 'max' : 'min';
        }

        context.report({
          node,
          messageId: 'sortForMinMax',
          data: { which, method: mathMethod || (isAccessingFirst ? 'min' : 'max') },
          // Only provide auto-fix for simple numeric arrays where we can determine direction
          fix: mathMethod && arrayName ? (fixer) => {
            return fixer.replaceText(node, `Math.${mathMethod}(...${arrayName})`);
          } : null,
        });
      },

      // Detect: const sorted = arr.sort(); sorted[0];
      // This is harder to detect statically, would need data flow analysis
    };
  },
};
