/**
 * Rule: prefer-length-check-first
 * Section: 7.7 Early Length Check for Array Comparisons
 *
 * Detects functions that compare two arrays using expensive operations
 * (sort, join, JSON.stringify) without checking lengths first.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Check array lengths before expensive comparisons',
      category: 'Performance',
      recommended: true,
    },
    fixable: null, // Complex fix - need to understand function structure
    messages: {
      missingLengthCheck:
        'Array comparison using {{operation}} without length check. Add `if ({{arr1}}.length !== {{arr2}}.length) return {{returnVal}};` first.',
    },
    schema: [],
  },

  create(context) {
    /**
     * Tracks function parameters that are likely arrays being compared
     */
    function findArrayComparisonInFunction(functionNode) {
      // Get function parameters
      const params = functionNode.params;
      if (params.length < 2) return null;

      // Get parameter names
      const paramNames = params
        .filter(p => p.type === 'Identifier')
        .map(p => p.name);

      if (paramNames.length < 2) return null;

      const body = functionNode.body;
      if (!body) return null;

      // Get the statements to analyze
      let statements = [];
      if (body.type === 'BlockStatement') {
        statements = body.body;
      }

      // Check if there's a length check early in the function
      let hasLengthCheck = false;
      let expensiveOp = null;
      let involvedArrays = { arr1: null, arr2: null };

      for (const stmt of statements) {
        // Check for length check pattern: if (a.length !== b.length)
        if (stmt.type === 'IfStatement' && stmt.test) {
          const test = stmt.test;
          if (
            test.type === 'BinaryExpression' &&
            (test.operator === '!==' || test.operator === '!=')
          ) {
            const { left, right } = test;
            if (isLengthAccess(left) && isLengthAccess(right)) {
              hasLengthCheck = true;
            }
          }
        }

        // Look for expensive array operations
        const op = findExpensiveArrayOp(stmt, paramNames);
        if (op && !expensiveOp) {
          expensiveOp = op;
          involvedArrays = op.arrays;
        }
      }

      if (expensiveOp && !hasLengthCheck) {
        return {
          operation: expensiveOp.operation,
          arr1: involvedArrays.arr1 || paramNames[0],
          arr2: involvedArrays.arr2 || paramNames[1],
          node: expensiveOp.node,
        };
      }

      return null;
    }

    /**
     * Check if a node is accessing .length property
     */
    function isLengthAccess(node) {
      return (
        node.type === 'MemberExpression' &&
        node.property.type === 'Identifier' &&
        node.property.name === 'length'
      );
    }

    /**
     * Find expensive array operations in a statement
     */
    function findExpensiveArrayOp(node, paramNames) {
      let result = null;

      function visit(n) {
        if (!n || result) return;

        // Check for .sort() or .toSorted()
        if (
          n.type === 'CallExpression' &&
          n.callee.type === 'MemberExpression'
        ) {
          const methodName = n.callee.property.name;
          const objName = n.callee.object.type === 'Identifier'
            ? n.callee.object.name
            : null;

          if (
            (methodName === 'sort' || methodName === 'toSorted') &&
            objName &&
            paramNames.includes(objName)
          ) {
            result = {
              operation: methodName + '()',
              node: n,
              arrays: { arr1: objName, arr2: null },
            };
            return;
          }

          // Check for .join()
          if (methodName === 'join') {
            // Check if the object is a sort call on a param
            if (
              n.callee.object.type === 'CallExpression' &&
              n.callee.object.callee.type === 'MemberExpression'
            ) {
              const innerCall = n.callee.object;
              const innerMethod = innerCall.callee.property.name;
              const innerObj = innerCall.callee.object;
              if (
                (innerMethod === 'sort' || innerMethod === 'toSorted') &&
                innerObj.type === 'Identifier' &&
                paramNames.includes(innerObj.name)
              ) {
                result = {
                  operation: `${innerMethod}().join()`,
                  node: n,
                  arrays: { arr1: innerObj.name, arr2: null },
                };
                return;
              }
            }
          }
        }

        // Check for JSON.stringify on params
        if (
          n.type === 'CallExpression' &&
          n.callee.type === 'MemberExpression' &&
          n.callee.object.type === 'Identifier' &&
          n.callee.object.name === 'JSON' &&
          n.callee.property.name === 'stringify'
        ) {
          const arg = n.arguments[0];
          if (arg && arg.type === 'Identifier' && paramNames.includes(arg.name)) {
            result = {
              operation: 'JSON.stringify()',
              node: n,
              arrays: { arr1: arg.name, arr2: null },
            };
            return;
          }
        }

        // Recurse into child nodes
        for (const key of Object.keys(n)) {
          const child = n[key];
          if (child && typeof child === 'object') {
            if (Array.isArray(child)) {
              for (const item of child) {
                if (item && typeof item === 'object' && item.type) {
                  visit(item);
                }
              }
            } else if (child.type) {
              visit(child);
            }
          }
        }
      }

      visit(node);
      return result;
    }

    return {
      // Check regular functions
      FunctionDeclaration(node) {
        const issue = findArrayComparisonInFunction(node);
        if (issue) {
          context.report({
            node: issue.node,
            messageId: 'missingLengthCheck',
            data: {
              operation: issue.operation,
              arr1: issue.arr1,
              arr2: issue.arr2,
              returnVal: 'true/false',
            },
          });
        }
      },

      // Check arrow functions and function expressions
      'ArrowFunctionExpression, FunctionExpression'(node) {
        const issue = findArrayComparisonInFunction(node);
        if (issue) {
          context.report({
            node: issue.node,
            messageId: 'missingLengthCheck',
            data: {
              operation: issue.operation,
              arr1: issue.arr1,
              arr2: issue.arr2,
              returnVal: 'true/false',
            },
          });
        }
      },
    };
  },
};
