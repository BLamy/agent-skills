/**
 * Rule: prefer-functional-setstate
 * Section: 5.5 Use Functional setState Updates
 *
 * Detects setState calls that reference state variables directly
 * instead of using the functional update pattern.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer functional setState when updating based on current state',
      category: 'Performance',
      recommended: true,
    },
    messages: {
      preferFunctional:
        'setState references "{{stateName}}" directly. Use functional update: set{{SetterSuffix}}(prev => ...) to avoid stale closures and enable stable callbacks.',
    },
    schema: [],
  },

  create(context) {
    // Track useState declarations: { setterName: stateName }
    const stateSetters = new Map();
    // Track which state variables exist
    const stateVariables = new Set();

    function isUseStateCall(node) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'useState'
      );
    }

    function findReferencedStateVariables(node, referencedVars = new Set()) {
      if (!node) return referencedVars;

      if (node.type === 'Identifier' && stateVariables.has(node.name)) {
        referencedVars.add(node.name);
      }

      // Recursively check all child nodes
      for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = node[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            child.forEach((c) => {
              if (c && typeof c === 'object') {
                findReferencedStateVariables(c, referencedVars);
              }
            });
          } else {
            findReferencedStateVariables(child, referencedVars);
          }
        }
      }

      return referencedVars;
    }

    function capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return {
      // Track useState declarations
      VariableDeclarator(node) {
        if (
          node.init &&
          isUseStateCall(node.init) &&
          node.id.type === 'ArrayPattern' &&
          node.id.elements.length >= 2
        ) {
          const [stateNode, setterNode] = node.id.elements;

          if (stateNode?.type === 'Identifier' && setterNode?.type === 'Identifier') {
            const stateName = stateNode.name;
            const setterName = setterNode.name;

            stateVariables.add(stateName);
            stateSetters.set(setterName, stateName);
          }
        }
      },

      // Check setState calls
      CallExpression(node) {
        // Check if this is a setState call
        if (node.callee.type !== 'Identifier') return;

        const setterName = node.callee.name;
        const stateName = stateSetters.get(setterName);

        if (!stateName) return;
        if (node.arguments.length === 0) return;

        const argument = node.arguments[0];

        // If already using functional update, skip
        if (
          argument.type === 'ArrowFunctionExpression' ||
          argument.type === 'FunctionExpression'
        ) {
          return;
        }

        // Find all state variables referenced in the argument
        const referencedVars = findReferencedStateVariables(argument);

        // If the corresponding state variable is referenced, report
        if (referencedVars.has(stateName)) {
          context.report({
            node,
            messageId: 'preferFunctional',
            data: {
              stateName,
              SetterSuffix: capitalizeFirst(stateName),
            },
          });
        }
      },
    };
  },
};
