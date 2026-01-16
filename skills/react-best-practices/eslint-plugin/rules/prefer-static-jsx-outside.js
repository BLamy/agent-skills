/**
 * Rule: prefer-static-jsx-outside
 * Section: 6.3 Hoist Static JSX Elements
 *
 * Detects JSX elements with all literal/static props inside React components
 * that could be hoisted outside for better performance.
 *
 * Note: React Compiler handles this automatically, so this rule is off by default.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Hoist static JSX elements outside components',
      category: 'Performance',
      recommended: false, // React Compiler handles this
    },
    fixable: null, // Complex - need to move code outside function
    messages: {
      hoistStaticJsx:
        'Static JSX element could be hoisted outside the component to avoid re-creation. Extract to a const above the component.',
    },
    schema: [],
  },

  create(context) {
    /**
     * Track if we're inside a React component
     */
    let componentStack = [];

    /**
     * Check if a function looks like a React component
     */
    function isReactComponent(node) {
      // Check if function name starts with capital letter
      let name = null;
      if (node.type === 'FunctionDeclaration' && node.id) {
        name = node.id.name;
      } else if (
        node.parent &&
        node.parent.type === 'VariableDeclarator' &&
        node.parent.id.type === 'Identifier'
      ) {
        name = node.parent.id.name;
      }

      if (!name) return false;

      // React components start with capital letter
      return /^[A-Z]/.test(name);
    }

    /**
     * Check if a JSX element has only static/literal attributes
     */
    function hasOnlyStaticProps(jsxElement) {
      const openingElement = jsxElement.openingElement;
      if (!openingElement) return false;

      for (const attr of openingElement.attributes) {
        // Spread attributes are dynamic
        if (attr.type === 'JSXSpreadAttribute') {
          return false;
        }

        if (attr.type === 'JSXAttribute') {
          const value = attr.value;

          // No value (like `disabled`) is static
          if (!value) continue;

          // String literals are static
          if (value.type === 'Literal') continue;

          // JSX expression containers need deeper check
          if (value.type === 'JSXExpressionContainer') {
            const expr = value.expression;

            // Literals are static
            if (expr.type === 'Literal') continue;

            // Template literals without expressions are static
            if (
              expr.type === 'TemplateLiteral' &&
              expr.expressions.length === 0
            ) {
              continue;
            }

            // Everything else is dynamic
            return false;
          }
        }
      }

      return true;
    }

    /**
     * Check if JSX element has only static children
     */
    function hasOnlyStaticChildren(jsxElement) {
      const children = jsxElement.children || [];

      for (const child of children) {
        // Text nodes are static
        if (child.type === 'JSXText') continue;

        // Nested JSX elements need recursive check
        if (child.type === 'JSXElement') {
          if (!hasOnlyStaticProps(child) || !hasOnlyStaticChildren(child)) {
            return false;
          }
          continue;
        }

        // Expression containers
        if (child.type === 'JSXExpressionContainer') {
          const expr = child.expression;

          // Empty expressions are ok
          if (expr.type === 'JSXEmptyExpression') continue;

          // Literals are static
          if (expr.type === 'Literal') continue;

          // Everything else is dynamic
          return false;
        }

        // Anything else is dynamic
        return false;
      }

      return true;
    }

    /**
     * Check if this JSX element is the main return of the component
     * (we don't want to flag the root return)
     */
    function isRootReturn(node) {
      let current = node;
      while (current.parent) {
        if (current.parent.type === 'ReturnStatement') {
          const returnStmt = current.parent;
          // Check if this return is directly in the component body
          if (
            returnStmt.parent &&
            returnStmt.parent.type === 'BlockStatement' &&
            returnStmt.parent.parent &&
            (returnStmt.parent.parent.type === 'FunctionDeclaration' ||
              returnStmt.parent.parent.type === 'FunctionExpression' ||
              returnStmt.parent.parent.type === 'ArrowFunctionExpression')
          ) {
            // This is the root return
            return current === node;
          }
        }
        current = current.parent;
      }
      return false;
    }

    return {
      // Track component entry
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
        if (isReactComponent(node)) {
          componentStack.push(node);
        }
      },

      // Track component exit
      'FunctionDeclaration:exit, FunctionExpression:exit, ArrowFunctionExpression:exit'(node) {
        if (componentStack.length > 0 && componentStack[componentStack.length - 1] === node) {
          componentStack.pop();
        }
      },

      // Check JSX elements
      JSXElement(node) {
        // Only check inside React components
        if (componentStack.length === 0) return;

        // Skip the root return element
        if (isRootReturn(node)) return;

        // Skip if parent is already a JSX element (will be checked with parent)
        if (node.parent && node.parent.type === 'JSXElement') return;

        // Check if this JSX element is fully static
        if (hasOnlyStaticProps(node) && hasOnlyStaticChildren(node)) {
          // Only report if it has some complexity (not just a simple element)
          const hasClassName = node.openingElement.attributes.some(
            attr => attr.type === 'JSXAttribute' &&
            attr.name &&
            (attr.name.name === 'className' || attr.name.name === 'class')
          );

          // Only flag if it has a className or multiple attributes
          if (hasClassName || node.openingElement.attributes.length >= 2) {
            context.report({
              node,
              messageId: 'hoistStaticJsx',
            });
          }
        }
      },
    };
  },
};
