/**
 * Rule: prefer-narrow-dependencies
 * Section: 5.3 Narrow Effect Dependencies
 *
 * Detects object dependencies in useEffect when only primitive properties are used.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer primitive dependencies over object dependencies in effects',
      category: 'Performance',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      narrowDependency:
        'Effect depends on "{{objectName}}" but only uses "{{properties}}". Use {{suggestion}} as dependencies instead to reduce re-runs.',
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.getSourceCode();

    function getUsedProperties(node, objectName) {
      const properties = new Set();

      function traverse(n) {
        if (!n) return;

        // Check for object.property access
        if (
          n.type === 'MemberExpression' &&
          n.object.type === 'Identifier' &&
          n.object.name === objectName &&
          n.property.type === 'Identifier'
        ) {
          properties.add(n.property.name);
        }

        // Check for destructuring
        if (n.type === 'VariableDeclarator') {
          if (
            n.init?.type === 'Identifier' &&
            n.init.name === objectName &&
            n.id.type === 'ObjectPattern'
          ) {
            n.id.properties.forEach((prop) => {
              if (prop.key?.type === 'Identifier') {
                properties.add(prop.key.name);
              }
            });
          }
        }

        for (const key of Object.keys(n)) {
          if (key === 'parent') continue;
          const child = n[key];
          if (child && typeof child === 'object') {
            if (Array.isArray(child)) {
              child.forEach(traverse);
            } else {
              traverse(child);
            }
          }
        }
      }

      traverse(node);
      return properties;
    }

    function isEffectHook(node) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        ['useEffect', 'useLayoutEffect', 'useMemo', 'useCallback'].includes(
          node.callee.name
        )
      );
    }

    return {
      CallExpression(node) {
        if (!isEffectHook(node)) return;
        if (node.arguments.length < 2) return;

        const callback = node.arguments[0];
        const depsArray = node.arguments[1];

        if (depsArray.type !== 'ArrayExpression') return;

        // Check each dependency
        for (const dep of depsArray.elements) {
          if (!dep) continue;

          // Only check identifier dependencies (objects)
          if (dep.type !== 'Identifier') continue;

          const objectName = dep.name;

          // Skip common primitives
          if (['id', 'key', 'index', 'count', 'value', 'name'].includes(objectName)) {
            continue;
          }

          // Get properties used in the callback
          const usedProps = getUsedProperties(callback, objectName);

          // If only using specific properties, suggest narrowing
          if (usedProps.size > 0 && usedProps.size <= 3) {
            const propsArray = Array.from(usedProps);
            const suggestion = propsArray.map((p) => `${objectName}.${p}`).join(', ');

            context.report({
              node: dep,
              messageId: 'narrowDependency',
              data: {
                objectName,
                properties: propsArray.join(', '),
                suggestion,
              },
              fix(fixer) {
                // Replace the single object dependency with property accesses
                const replacement = propsArray.map((p) => `${objectName}.${p}`).join(', ');
                return fixer.replaceText(dep, replacement);
              },
            });
          }
        }
      },
    };
  },
};
