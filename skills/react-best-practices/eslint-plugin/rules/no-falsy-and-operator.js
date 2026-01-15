/**
 * Rule: no-falsy-and-operator
 * Section: 6.7 Use Explicit Conditional Rendering
 *
 * Detects && operators in JSX that might render falsy values like 0 or NaN.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Avoid && with potentially falsy values in JSX',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      falsyAnd:
        '"{{name}}" might be 0 or NaN which will render. Use explicit check: {{name}} > 0 ? <Component /> : null',
      falsyAndGeneric:
        'Left side of && might be 0 or NaN which will render. Use ternary: condition ? <Component /> : null',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    // Track numeric variables
    const numericVariables = new Set();

    // Common patterns that indicate a number
    const numericPatterns = [
      /count/i,
      /length/i,
      /size/i,
      /total/i,
      /num/i,
      /index/i,
      /amount/i,
      /quantity/i,
      /price/i,
      /width/i,
      /height/i,
    ];

    function isLikelyNumeric(name) {
      return numericPatterns.some((pattern) => pattern.test(name));
    }

    function isExplicitBooleanCheck(node) {
      // Check for patterns like: count > 0, count !== 0, count >= 1, Boolean(count)
      if (node.type === 'BinaryExpression') {
        const ops = ['>', '<', '>=', '<=', '!==', '!=', '===', '=='];
        return ops.includes(node.operator);
      }
      if (node.type === 'UnaryExpression' && node.operator === '!') {
        return true;
      }
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'Boolean'
      ) {
        return true;
      }
      return false;
    }

    return {
      // Track variable declarations to infer types
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') {
          const name = node.id.name;

          // Check if initialized to a number
          if (node.init?.type === 'Literal' && typeof node.init.value === 'number') {
            numericVariables.add(name);
          }

          // Check if it's from .length
          if (
            node.init?.type === 'MemberExpression' &&
            node.init.property.name === 'length'
          ) {
            numericVariables.add(name);
          }

          // Check name patterns
          if (isLikelyNumeric(name)) {
            numericVariables.add(name);
          }
        }
      },

      // Check && expressions in JSX
      'JSXExpressionContainer > LogicalExpression[operator="&&"]'(node) {
        const left = node.left;

        // Skip if already has explicit boolean check
        if (isExplicitBooleanCheck(left)) {
          return;
        }

        let varName = null;
        let shouldWarn = false;

        // Check direct identifier
        if (left.type === 'Identifier') {
          varName = left.name;
          if (numericVariables.has(varName) || isLikelyNumeric(varName)) {
            shouldWarn = true;
          }
        }

        // Check member expressions like items.length
        if (left.type === 'MemberExpression') {
          if (left.property.name === 'length') {
            varName = sourceCode.getText(left);
            shouldWarn = true;
          }
          if (left.property.name === 'size') {
            varName = sourceCode.getText(left);
            shouldWarn = true;
          }
          if (isLikelyNumeric(left.property.name)) {
            varName = sourceCode.getText(left);
            shouldWarn = true;
          }
        }

        if (shouldWarn) {
          const rightText = sourceCode.getText(node.right);
          const leftText = sourceCode.getText(left);

          context.report({
            node,
            messageId: varName ? 'falsyAnd' : 'falsyAndGeneric',
            data: { name: varName || leftText },
            fix(fixer) {
              return fixer.replaceText(
                node,
                `${leftText} > 0 ? ${rightText} : null`
              );
            },
          });
        }
      },
    };
  },
};
