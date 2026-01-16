import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-multiple-array-iterations.js';

describe('no-multiple-array-iterations', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-multiple-array-iterations', rule, {
      valid: [
        { code: `const admins = users.filter(u => u.isAdmin);` },
        {
          code: `
            const admins = users.filter(u => u.isAdmin);
            const testers = users.filter(u => u.isTester);
          `,
        },
        {
          code: `
            const admins = users.filter(u => u.isAdmin);
            const activeItems = items.filter(i => i.active);
            const validOrders = orders.filter(o => o.valid);
          `,
        },
      ],
      invalid: [
        {
          code: `
            const admins = users.filter(u => u.isAdmin);
            const testers = users.filter(u => u.isTester);
            const inactive = users.filter(u => !u.active);
          `,
          errors: [{ messageId: 'multipleIterations' }],
        },
      ],
    });
  });
});
