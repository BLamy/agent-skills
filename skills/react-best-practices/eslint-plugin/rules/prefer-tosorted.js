/**
 * Rule: prefer-tosorted
 * Section: 7.12 Use toSorted() Instead of sort() for Immutability
 *
 * Detects .sort() calls that mutate arrays and suggests .toSorted().
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer .toSorted() over .sort() to avoid mutation',
      category: 'Performance',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      preferToSorted:
        '.sort() mutates the original array. Use .toSorted() for immutable sorting, or [...array].sort() for older browsers.',
      sortOnState:
        '.sort() mutates the array. In React, mutating state/props causes bugs. Use .toSorted() or [...{{arrayName}}].sort().',
    },
    schema: [
      {
        type: 'object',
        properties: {
          fixToSpread: {
            type: 'boolean',
            default: false,
            description: 'Fix to [...array].sort() instead of .toSorted() for browser compatibility',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const fixToSpread = context.options[0]?.fixToSpread ?? false;
    const sourceCode = context.getSourceCode();

    // Track useState variables
    const stateVariables = new Set();
    // Track props parameters
    const propsVariables = new Set();

    function isUseStateCall(node) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'useState'
      );
    }

    return {
      // Track useState declarations
      VariableDeclarator(node) {
        if (
          node.init &&
          isUseStateCall(node.init) &&
          node.id.type === 'ArrayPattern' &&
          node.id.elements.length >= 1
        ) {
          const stateNode = node.id.elements[0];
          if (stateNode?.type === 'Identifier') {
            stateVariables.add(stateNode.name);
          }
        }
      },

      // Track function props parameters
      FunctionDeclaration(node) {
        if (node.params.length > 0) {
          const firstParam = node.params[0];
          if (firstParam.type === 'ObjectPattern') {
            firstParam.properties.forEach((prop) => {
              if (prop.key?.type === 'Identifier') {
                propsVariables.add(prop.key.name);
              }
            });
          }
        }
      },

      ArrowFunctionExpression(node) {
        if (node.params.length > 0) {
          const firstParam = node.params[0];
          if (firstParam.type === 'ObjectPattern') {
            firstParam.properties.forEach((prop) => {
              if (prop.key?.type === 'Identifier') {
                propsVariables.add(prop.key.name);
              }
            });
          }
        }
      },

      // Detect .sort() calls
      'CallExpression[callee.property.name="sort"]'(node) {
        // Skip if already using spread [...arr].sort()
        if (node.callee.object.type === 'ArrayExpression') {
          const firstElement = node.callee.object.elements[0];
          if (firstElement?.type === 'SpreadElement') {
            return;
          }
        }

        // Check if sorting state or props
        let isStateOrProps = false;
        let arrayName = 'array';

        if (node.callee.object.type === 'Identifier') {
          arrayName = node.callee.object.name;
          if (stateVariables.has(arrayName) || propsVariables.has(arrayName)) {
            isStateOrProps = true;
          }
        }

        // Get the array text for fix
        const arrayText = sourceCode.getText(node.callee.object);
        const argsText = node.arguments.length > 0
          ? sourceCode.getText(node.arguments[0])
          : '';

        if (isStateOrProps) {
          context.report({
            node,
            messageId: 'sortOnState',
            data: { arrayName },
            fix(fixer) {
              if (fixToSpread) {
                const newCode = argsText
                  ? `[...${arrayText}].sort(${argsText})`
                  : `[...${arrayText}].sort()`;
                return fixer.replaceText(node, newCode);
              } else {
                const newCode = argsText
                  ? `${arrayText}.toSorted(${argsText})`
                  : `${arrayText}.toSorted()`;
                return fixer.replaceText(node, newCode);
              }
            },
          });
        } else {
          context.report({
            node,
            messageId: 'preferToSorted',
            fix(fixer) {
              if (fixToSpread) {
                const newCode = argsText
                  ? `[...${arrayText}].sort(${argsText})`
                  : `[...${arrayText}].sort()`;
                return fixer.replaceText(node, newCode);
              } else {
                const newCode = argsText
                  ? `${arrayText}.toSorted(${argsText})`
                  : `${arrayText}.toSorted()`;
                return fixer.replaceText(node, newCode);
              }
            },
          });
        }
      },
    };
  },
};
