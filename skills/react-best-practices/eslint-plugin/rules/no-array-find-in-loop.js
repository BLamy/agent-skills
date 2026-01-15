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
    fixable: 'code',
    messages: {
      findInLoop:
        '.find() inside a loop is O(n) per iteration. Build an index Map before the loop for O(1) lookups.',
      findInMap:
        '.find() inside .map()/.filter()/.forEach() is O(n²). Build an index Map first.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.getSourceCode();
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
      return null;
    }

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Extracts the comparison info from a find callback
     * e.g., users.find(u => u.id === order.userId)
     * Returns { paramName, keyProp, lookupValue } or null if pattern not recognized
     */
    function extractFindPattern(findNode) {
      const callback = findNode.arguments[0];
      if (!callback) return null;

      // Get callback parameter name
      let paramName;
      if (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') {
        if (callback.params.length === 0) return null;
        const param = callback.params[0];
        if (param.type !== 'Identifier') return null;
        paramName = param.name;
      } else {
        return null;
      }

      // Get the comparison expression
      let comparison;
      if (callback.body.type === 'BinaryExpression') {
        comparison = callback.body;
      } else if (callback.body.type === 'BlockStatement') {
        // Look for return statement
        const returnStmt = callback.body.body.find(s => s.type === 'ReturnStatement');
        if (returnStmt?.argument?.type === 'BinaryExpression') {
          comparison = returnStmt.argument;
        }
      }

      if (!comparison || comparison.operator !== '===') return null;

      // Figure out which side is the param.property and which is the lookup value
      let keyProp, lookupValue;

      const { left, right } = comparison;

      // Check if left is paramName.something
      if (
        left.type === 'MemberExpression' &&
        left.object.type === 'Identifier' &&
        left.object.name === paramName &&
        left.property.type === 'Identifier'
      ) {
        keyProp = left.property.name;
        lookupValue = sourceCode.getText(right);
      }
      // Check if right is paramName.something
      else if (
        right.type === 'MemberExpression' &&
        right.object.type === 'Identifier' &&
        right.object.name === paramName &&
        right.property.type === 'Identifier'
      ) {
        keyProp = right.property.name;
        lookupValue = sourceCode.getText(left);
      } else {
        return null;
      }

      return { paramName, keyProp, lookupValue };
    }

    /**
     * Gets the statement that contains the loop (to insert Map declaration before it)
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
      'CallExpression[callee.property.name="flatMap"]': enterLoop,
      'CallExpression[callee.property.name="flatMap"]:exit': exitLoop,

      // Detect .find() calls
      'CallExpression[callee.property.name="find"]'(node) {
        if (!isInsideLoop()) return;

        const arrayName = getArrayName(node);
        const isInArrayMethod = loopStack.some(isArrayMethod);
        const outermostLoop = loopStack[0];

        // Try to extract the find pattern for auto-fix
        const pattern = extractFindPattern(node);

        context.report({
          node,
          messageId: isInArrayMethod ? 'findInMap' : 'findInLoop',
          fix: pattern && arrayName ? (fixer) => {
            const { paramName, keyProp, lookupValue } = pattern;
            const mapName = `${arrayName}By${capitalize(keyProp)}`;

            // Create the Map declaration
            const mapDeclaration = `const ${mapName} = new Map(${arrayName}.map(${paramName} => [${paramName}.${keyProp}, ${paramName}]));\n`;

            // Find where to insert the Map declaration
            const containingStatement = getContainingStatement(outermostLoop);

            // Replace the find() call with map.get()
            const replacement = `${mapName}.get(${lookupValue})`;

            return [
              fixer.insertTextBefore(containingStatement, mapDeclaration),
              fixer.replaceText(node, replacement),
            ];
          } : null,
        });
      },
    };
  },
};
