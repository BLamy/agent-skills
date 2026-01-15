import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-await-before-condition.js';

describe('no-await-before-condition', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-await-before-condition', rule, {
      valid: [
        {
          code: `
            async function handle(skip) {
              if (skip) return { skipped: true };
              const data = await fetchData();
              return data;
            }
          `,
        },
        {
          code: `
            async function handle(userId) {
              const user = await fetchUser(userId);
              if (!user) return { error: 'Not found' };
              return user;
            }
          `,
        },
      ],
      invalid: [
        {
          code: `
            async function handle(userId, skip) {
              const data = await fetchData(userId);
              if (skip) return { skipped: true };
              return data;
            }
          `,
          errors: [{ messageId: 'deferAwait' }],
        },
      ],
    });
  });
});
