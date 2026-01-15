import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-includes-in-loop.js';

describe('no-includes-in-loop', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-includes-in-loop', rule, {
      valid: [
        { code: `const hasAdmin = roles.includes('admin');` },
        {
          code: `
            const allowedSet = new Set(allowedIds);
            items.filter(item => allowedSet.has(item.id));
          `,
        },
      ],
      invalid: [
        {
          code: `items.filter(item => allowedIds.includes(item.id));`,
          errors: [{ messageId: 'includesInLoop' }],
        },
        {
          code: `
            for (const item of items) {
              if (allowedIds.includes(item.id)) process(item);
            }
          `,
          errors: [{ messageId: 'includesInLoop' }],
        },
      ],
    });
  });
});
