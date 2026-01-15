/**
 * Rule: no-array-find-in-loop
 * Section: 7.2 Build Index Maps for Repeated Lookups
 *
 * Detects .find() calls inside loops that could be optimized
 * using a Map for O(1) lookups.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid .find() inside loops - use Map for O(1) lookups',
      category: 'Performance',
      recommended: true,
    },
    messages: {
      findInLoop:
        '.find() inside a loop is O(n) per iteration. Build an index Map before the loop for O(1) lookups: const {{suggestion}}',
      findInMap:
        '.find() inside .map()/.filter()/.forEach() is O(n²). Build an index Map first: const itemById = new Map(items.map(i => [i.id, i]))',
    },
    schema: [],
  },

  create(context) {
    // Track if we're inside a loop or array method
    const loopStack = [];

    function enterLoop(node) {
      loopStack.push(node);
    }

    function exitLoop() {
      loopStack.pop();
    }

    function isInsideLoop() {
      return loopStack.length > 0;
    }

    function isArrayMethod(node) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        ['map', 'filter', 'forEach', 'reduce', 'some', 'every', 'flatMap'].includes(
          node.callee.property.name
        )
      );
    }

    function getArrayName(node) {
      if (node.callee?.object?.type === 'Identifier') {
        return node.callee.object.name;
      }
      return 'items';
    }

    return {
      // Track traditional loops
      ForStatement: enterLoop,
      'ForStatement:exit': exitLoop,
      ForInStatement: enterLoop,
      'ForInStatement:exit': exitLoop,
      ForOfStatement: enterLoop,
      'ForOfStatement:exit': exitLoop,
      WhileStatement: enterLoop,
      'WhileStatement:exit': exitLoop,
      DoWhileStatement: enterLoop,
      'DoWhileStatement:exit': exitLoop,

      // Track array methods with callbacks
      'CallExpression[callee.property.name="map"]': enterLoop,
      'CallExpression[callee.property.name="map"]:exit': exitLoop,
      'CallExpression[callee.property.name="filter"]': enterLoop,
      'CallExpression[callee.property.name="filter"]:exit': exitLoop,
      'CallExpression[callee.property.name="forEach"]': enterLoop,
      'CallExpression[callee.property.name="forEach"]:exit': exitLoop,
      'CallExpression[callee.property.name="reduce"]': enterLoop,
      'CallExpression[callee.property.name="reduce"]:exit': exitLoop,
      'CallExpression[callee.property.name="some"]': enterLoop,
      'CallExpression[callee.property.name="some"]:exit': exitLoop,
      'CallExpression[callee.property.name="every"]': enterLoop,
      'CallExpression[callee.property.name="every"]:exit': exitLoop,
      'CallExpression[callee.property.name="flatMap"]': enterLoop,
      'CallExpression[callee.property.name="flatMap"]:exit': exitLoop,

      // Detect .find() calls
      'CallExpression[callee.property.name="find"]'(node) {
        if (!isInsideLoop()) return;

        const arrayName = getArrayName(node);
        const suggestion = `${arrayName}ById = new Map(${arrayName}.map(x => [x.id, x]))`;

        // Check if inside array method or traditional loop
        const isInArrayMethod = loopStack.some(isArrayMethod);

        context.report({
          node,
          messageId: isInArrayMethod ? 'findInMap' : 'findInLoop',
          data: { suggestion },
        });
      },
    };
  },
};
