/**
 * Rule: no-includes-in-loop
 * Section: 7.11 Use Set/Map for O(1) Lookups
 *
 * Detects .includes() calls inside loops that could be optimized
 * using a Set for O(1) lookups.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid .includes() inside loops - use Set for O(1) lookups',
      category: 'Performance',
      recommended: true,
    },
    messages: {
      includesInLoop:
        '.includes() inside a loop is O(n) per iteration. Convert to Set before the loop: const {{arrayName}}Set = new Set({{arrayName}})',
    },
    schema: [],
  },

  create(context) {
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

      // Detect .includes() calls
      'CallExpression[callee.property.name="includes"]'(node) {
        if (!isInsideLoop()) return;

        // Get the array name being checked
        let arrayName = 'array';
        if (node.callee.object.type === 'Identifier') {
          arrayName = node.callee.object.name;
        }

        context.report({
          node,
          messageId: 'includesInLoop',
          data: { arrayName },
        });
      },
    };
  },
};
