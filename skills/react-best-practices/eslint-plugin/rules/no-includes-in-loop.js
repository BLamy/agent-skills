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
    fixable: 'code',
    messages: {
      includesInLoop:
        '.includes() inside a loop is O(n) per iteration. Convert to Set before the loop for O(1) lookups.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
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

    /**
     * Gets the statement that contains the loop (to insert Set declaration before it)
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
        let arrayName = null;
        if (node.callee.object.type === 'Identifier') {
          arrayName = node.callee.object.name;
        }

        // Get the argument being searched for
        const searchArg = node.arguments[0];
        const searchValue = searchArg ? sourceCode.getText(searchArg) : null;

        const outermostLoop = loopStack[0];

        context.report({
          node,
          messageId: 'includesInLoop',
          fix: arrayName && searchValue ? (fixer) => {
            const setName = `${arrayName}Set`;

            // Create the Set declaration
            const setDeclaration = `const ${setName} = new Set(${arrayName});\n`;

            // Find where to insert the Set declaration
            const containingStatement = getContainingStatement(outermostLoop);

            // Replace the includes() call with set.has()
            const replacement = `${setName}.has(${searchValue})`;

            return [
              fixer.insertTextBefore(containingStatement, setDeclaration),
              fixer.replaceText(node, replacement),
            ];
          } : null,
        });
      },
    };
  },
};
