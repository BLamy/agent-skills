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
    fixable: 'code',
    messages: {
      preferFunctional:
        'setState references "{{stateName}}" directly. Use functional update: set{{SetterSuffix}}(prev => ...) to avoid stale closures and enable stable callbacks.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    // Track state per component to avoid cross-component false positives
    // Stack of { setters: Map, variables: Set } for nested components
    const componentStack = [];

    function getCurrentState() {
      return componentStack.length > 0
        ? componentStack[componentStack.length - 1]
        : { setters: new Map(), variables: new Set() };
    }

    function isComponentLike(node) {
      // Check if function name starts with capital letter (React component convention)
      let name = null;
      if (node.type === 'FunctionDeclaration' && node.id) {
        name = node.id.name;
      } else if (
        node.parent?.type === 'VariableDeclarator' &&
        node.parent.id?.type === 'Identifier'
      ) {
        name = node.parent.id.name;
      }
      return name && /^[A-Z]/.test(name);
    }

    function isUseStateCall(node) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'useState'
      );
    }

    function findReferencedStateVariables(node, stateVariables, referencedVars = new Set()) {
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
                findReferencedStateVariables(c, stateVariables, referencedVars);
              }
            });
          } else {
            findReferencedStateVariables(child, stateVariables, referencedVars);
          }
        }
      }

      return referencedVars;
    }

    function capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function replaceStateWithPrev(text, stateName) {
      // Replace the state variable with 'prev' using word boundaries
      // This handles cases like: items -> prev, items.filter -> prev.filter
      const regex = new RegExp(`\\b${stateName}\\b`, 'g');
      return text.replace(regex, 'prev');
    }

    return {
      // Track component entry
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        if (isComponentLike(node)) {
          componentStack.push({ setters: new Map(), variables: new Set() });
        }
      },

      // Track component exit
      'FunctionDeclaration:exit, FunctionExpression:exit, ArrowFunctionExpression:exit'(node) {
        if (isComponentLike(node) && componentStack.length > 0) {
          componentStack.pop();
        }
      },

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

            const state = getCurrentState();
            state.variables.add(stateName);
            state.setters.set(setterName, stateName);
          }
        }
      },

      // Check setState calls
      CallExpression(node) {
        // Check if this is a setState call
        if (node.callee.type !== 'Identifier') return;

        const state = getCurrentState();
        const setterName = node.callee.name;
        const stateName = state.setters.get(setterName);

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
        const referencedVars = findReferencedStateVariables(argument, state.variables);

        // If the corresponding state variable is referenced, report
        if (referencedVars.has(stateName)) {
          context.report({
            node,
            messageId: 'preferFunctional',
            data: {
              stateName,
              SetterSuffix: capitalizeFirst(stateName),
            },
            fix(fixer) {
              const argText = sourceCode.getText(argument);
              const newArgText = replaceStateWithPrev(argText, stateName);
              return fixer.replaceText(argument, `prev => ${newArgText}`);
            },
          });
        }
      },
    };
  },
};
