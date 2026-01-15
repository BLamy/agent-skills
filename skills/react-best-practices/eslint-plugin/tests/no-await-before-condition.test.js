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
        {
          // Variable used in condition - can't defer
          code: `
            async function handle() {
              const data = await fetchData();
              if (!data.valid) return null;
              return process(data);
            }
          `,
        },
        {
          // Variable used in early return - can't defer
          code: `
            async function handle(skip) {
              const data = await fetchData();
              if (skip) return { cached: data };
              return process(data);
            }
          `,
        },
        {
          // Variable not used at all after - no optimization opportunity
          code: `
            async function handle(skip) {
              const data = await fetchData();
              if (skip) return null;
              console.log('done');
            }
          `,
        },
      ],
      invalid: [
        {
          // Variable used later but not in condition/return - can defer!
          code: `
            async function handle(userId, skip) {
              const data = await fetchData(userId);
              if (skip) return { skipped: true };
              return data;
            }
          `,
          errors: [{ messageId: 'deferAwait' }],
        },
        {
          // Variable used in process() later - can defer the await
          code: `
            async function handle(skip) {
              const data = await fetchData();
              if (skip) return null;
              process(data);
            }
          `,
          errors: [{ messageId: 'deferAwait' }],
        },
      ],
    });
  });
});
