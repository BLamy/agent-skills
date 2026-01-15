/**
 * Rule: no-regexp-in-render
 * Section: 7.9 Hoist RegExp Creation
 *
 * Detects RegExp creation inside React components that should be hoisted
 * or memoized.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Hoist RegExp creation outside of React components',
      category: 'Performance',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      regexpInRender:
        'RegExp created inside component runs on every render. Hoist to module scope or wrap in React.useMemo().',
      regexpLiteralInRender:
        'RegExp literal inside component is recreated on every render. Hoist to module scope for static patterns.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    // Track if we're inside a React component
    const componentStack = [];

    function isComponentName(name) {
      return name && /^[A-Z]/.test(name);
    }

    function enterComponent(node) {
      componentStack.push(node);
    }

    function exitComponent() {
      componentStack.pop();
    }

    function isInsideComponent() {
      return componentStack.length > 0;
    }

    function isInsideUseMemo(node) {
      let current = node.parent;
      while (current) {
        if (current.type === 'CallExpression') {
          // Check for useMemo()
          if (
            current.callee.type === 'Identifier' &&
            current.callee.name === 'useMemo'
          ) {
            return true;
          }
          // Check for React.useMemo()
          if (
            current.callee.type === 'MemberExpression' &&
            current.callee.object.type === 'Identifier' &&
            current.callee.object.name === 'React' &&
            current.callee.property.name === 'useMemo'
          ) {
            return true;
          }
        }
        current = current.parent;
      }
      return false;
    }

    function isInsideCallback(node) {
      const hookNames = ['useCallback', 'useMemo', 'useEffect', 'useLayoutEffect'];
      let current = node.parent;
      while (current) {
        if (current.type === 'CallExpression') {
          // Check for useX()
          if (
            current.callee.type === 'Identifier' &&
            hookNames.includes(current.callee.name)
          ) {
            return true;
          }
          // Check for React.useX()
          if (
            current.callee.type === 'MemberExpression' &&
            current.callee.object.type === 'Identifier' &&
            current.callee.object.name === 'React' &&
            hookNames.includes(current.callee.property.name)
          ) {
            return true;
          }
        }
        current = current.parent;
      }
      return false;
    }

    return {
      // Track function components
      FunctionDeclaration(node) {
        if (node.id && isComponentName(node.id.name)) {
          enterComponent(node);
        }
      },
      'FunctionDeclaration:exit'(node) {
        if (node.id && isComponentName(node.id.name)) {
          exitComponent();
        }
      },

      // Track arrow function components
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          isComponentName(node.id.name) &&
          (node.init?.type === 'ArrowFunctionExpression' ||
            node.init?.type === 'FunctionExpression')
        ) {
          enterComponent(node);
        }
      },
      'VariableDeclarator:exit'(node) {
        if (
          node.id.type === 'Identifier' &&
          isComponentName(node.id.name) &&
          (node.init?.type === 'ArrowFunctionExpression' ||
            node.init?.type === 'FunctionExpression')
        ) {
          exitComponent();
        }
      },

      // Detect new RegExp()
      'NewExpression[callee.name="RegExp"]'(node) {
        if (!isInsideComponent()) return;
        if (isInsideUseMemo(node)) return;
        if (isInsideCallback(node)) return;

        context.report({
          node,
          messageId: 'regexpInRender',
        });
      },

      // Detect RegExp literals in specific contexts
      Literal(node) {
        if (!node.regex) return;
        if (!isInsideComponent()) return;
        if (isInsideUseMemo(node)) return;

        // Check if it's in the direct render path (not inside a callback/memo)
        if (isInsideCallback(node)) return;

        // Only warn for complex patterns that are clearly expensive
        const pattern = node.regex.pattern;
        if (pattern.length > 20 || pattern.includes('(?') || pattern.includes('\\d')) {
          const regexpText = sourceCode.getText(node);
          context.report({
            node,
            messageId: 'regexpLiteralInRender',
            fix(fixer) {
              // Wrap the regexp literal in React.useMemo (React is always imported, useMemo might not be)
              return fixer.replaceText(node, `React.useMemo(() => ${regexpText}, [])`);
            },
          });
        }
      },
    };
  },
};
