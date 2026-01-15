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
    messages: {
      sortForMinMax:
        'Sorting to find {{which}} is O(n log n). Use a single loop O(n) or Math.{{method}}() instead.',
    },
    schema: [],
  },

  create(context) {
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
        const method = isAccessingFirst ? 'min' : 'max';

        context.report({
          node,
          messageId: 'sortForMinMax',
          data: { which, method },
        });
      },

      // Detect: const sorted = arr.sort(); sorted[0];
      // This is harder to detect statically, would need data flow analysis
    };
  },
};
