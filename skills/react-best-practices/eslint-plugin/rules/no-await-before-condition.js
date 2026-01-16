/**
 * Rule: no-await-before-condition
 * Section: 1.1 Defer Await Until Needed
 *
 * Detects await statements followed by early return conditions that
 * don't use the awaited value.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Defer await until the value is actually needed',
      category: 'Performance',
      recommended: true,
    },
    messages: {
      deferAwait:
        'Await for "{{varName}}" blocks execution before the condition check. Move the await after the condition if "{{varName}}" is only used in one branch.',
    },
    schema: [],
  },

  create(context) {
    function getAwaitedVariable(statement) {
      if (
        statement.type === 'VariableDeclaration' &&
        statement.declarations.length === 1
      ) {
        const decl = statement.declarations[0];
        if (
          decl.init?.type === 'AwaitExpression' &&
          decl.id.type === 'Identifier'
        ) {
          return decl.id.name;
        }
      }
      return null;
    }

    function containsIdentifier(node, name) {
      if (!node) return false;

      if (node.type === 'Identifier' && node.name === name) {
        return true;
      }

      for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = node[key];
        if (child && typeof child === 'object') {
          if (Array.isArray(child)) {
            if (child.some((c) => c && containsIdentifier(c, name))) {
              return true;
            }
          } else {
            if (containsIdentifier(child, name)) {
              return true;
            }
          }
        }
      }

      return false;
    }

    function isEarlyReturn(statement) {
      // Direct return: if (condition) return ...
      if (
        statement.type === 'IfStatement' &&
        statement.consequent
      ) {
        const consequent = statement.consequent;
        if (consequent.type === 'ReturnStatement') {
          return true;
        }
        if (
          consequent.type === 'BlockStatement' &&
          consequent.body.length === 1 &&
          consequent.body[0].type === 'ReturnStatement'
        ) {
          return true;
        }
      }
      return false;
    }

    return {
      BlockStatement(node) {
        const body = node.body;

        for (let i = 0; i < body.length - 1; i++) {
          const current = body[i];
          const next = body[i + 1];

          // Check if current is an await assignment
          const awaitedVar = getAwaitedVariable(current);
          if (!awaitedVar) continue;

          // Check if next is an early return
          if (!isEarlyReturn(next)) continue;

          // Check if the condition uses the awaited variable
          const condition = next.test;
          const consequent = next.consequent;

          const conditionUsesVar = containsIdentifier(condition, awaitedVar);
          const returnUsesVar = containsIdentifier(consequent, awaitedVar);

          // If condition doesn't use the var and return doesn't use the var,
          // check if variable is used in remaining statements after the early return
          if (!conditionUsesVar && !returnUsesVar) {
            // Check if variable is used in subsequent statements
            let usedLater = false;
            for (let j = i + 2; j < body.length; j++) {
              if (containsIdentifier(body[j], awaitedVar)) {
                usedLater = true;
                break;
              }
            }
            // Only report if the variable IS used later (that's the optimization opportunity)
            // If not used later, there's no benefit to deferring
            if (!usedLater) continue;

            context.report({
              node: current,
              messageId: 'deferAwait',
              data: { varName: awaitedVar },
            });
          }
        }
      },
    };
  },
};
