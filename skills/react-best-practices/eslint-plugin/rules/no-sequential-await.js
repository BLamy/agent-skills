/**
 * Rule: no-sequential-await
 * Section: 1.4 Promise.all() for Independent Operations
 *
 * Detects sequential await statements that could potentially be parallelized
 * using Promise.all().
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect sequential await statements that could be parallelized',
      category: 'Performance',
      recommended: true,
    },
    messages: {
      sequentialAwait:
        'Sequential await statements detected. Consider using Promise.all() for independent operations to avoid waterfall requests. If these operations depend on each other, ignore this warning.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          minSequentialAwaits: {
            type: 'integer',
            minimum: 2,
            default: 2,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const minSequentialAwaits = context.options[0]?.minSequentialAwaits ?? 2;

    function checkBlockForSequentialAwaits(node) {
      const body = node.body || node.consequent;
      if (!Array.isArray(body)) return;

      const awaitStatements = [];

      for (let i = 0; i < body.length; i++) {
        const statement = body[i];

        // Check for: const x = await foo()
        if (
          statement.type === 'VariableDeclaration' &&
          statement.declarations.some(
            (d) => d.init && d.init.type === 'AwaitExpression'
          )
        ) {
          awaitStatements.push({ index: i, node: statement });
        }
        // Check for: await foo()
        else if (
          statement.type === 'ExpressionStatement' &&
          statement.expression.type === 'AwaitExpression'
        ) {
          awaitStatements.push({ index: i, node: statement });
        }
        // If we hit a non-await statement, check if we have enough sequential awaits
        else {
          if (awaitStatements.length >= minSequentialAwaits) {
            reportSequentialAwaits(awaitStatements);
          }
          awaitStatements.length = 0;
        }
      }

      // Check remaining awaits at end of block
      if (awaitStatements.length >= minSequentialAwaits) {
        reportSequentialAwaits(awaitStatements);
      }
    }

    function reportSequentialAwaits(awaits) {
      // Report on the first await in the sequence
      context.report({
        node: awaits[0].node,
        messageId: 'sequentialAwait',
      });
    }

    return {
      BlockStatement: checkBlockForSequentialAwaits,
      Program: checkBlockForSequentialAwaits,
    };
  },
};
