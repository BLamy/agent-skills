import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-array-find-in-loop.js';

describe('no-array-find-in-loop', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-array-find-in-loop', rule, {
      valid: [
        {
          code: `const user = users.find(u => u.id === id);`,
        },
        {
          code: `
            const userById = new Map(users.map(u => [u.id, u]));
            orders.map(order => userById.get(order.userId));
          `,
        },
      ],
      invalid: [
        {
          code: `
            orders.map(order => ({
              user: users.find(u => u.id === order.userId)
            }));
          `,
          errors: [{ messageId: 'findInMap' }],
        },
        {
          code: `
            for (const order of orders) {
              const user = users.find(u => u.id === order.userId);
            }
          `,
          errors: [{ messageId: 'findInLoop' }],
        },
      ],
    });
  });
});
