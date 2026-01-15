/**
 * Rule: no-object-spread-in-jsx-prop
 * Section: 3.2 Minimize Serialization at RSC Boundaries
 *
 * Detects spreading entire objects as props when only specific fields are needed.
 * Also helps identify potential over-serialization in RSC boundaries.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid spreading objects as props, pass only needed fields',
      category: 'Performance',
      recommended: false,
    },
    messages: {
      avoidSpread:
        'Spreading "{{name}}" passes all properties. Pass only the fields the component needs to reduce serialization in RSC and improve readability.',
      avoidSpreadGeneric:
        'Spreading an object passes all properties. Pass only the fields the component needs.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedComponents: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    const allowedComponents = new Set(context.options[0]?.allowedComponents ?? []);

    function getComponentName(node) {
      if (node.openingElement?.name?.type === 'JSXIdentifier') {
        return node.openingElement.name.name;
      }
      return null;
    }

    return {
      JSXSpreadAttribute(node) {
        // Get parent JSX element
        let parent = node.parent;
        while (parent && parent.type !== 'JSXElement') {
          parent = parent.parent;
        }

        if (parent) {
          const componentName = getComponentName(parent);
          if (componentName && allowedComponents.has(componentName)) {
            return;
          }
        }

        const argument = node.argument;

        if (argument.type === 'Identifier') {
          context.report({
            node,
            messageId: 'avoidSpread',
            data: { name: argument.name },
          });
        } else if (argument.type === 'MemberExpression') {
          context.report({
            node,
            messageId: 'avoidSpread',
            data: { name: sourceCode.getText(argument) },
          });
        } else {
          context.report({
            node,
            messageId: 'avoidSpreadGeneric',
          });
        }
      },
    };
  },
};
