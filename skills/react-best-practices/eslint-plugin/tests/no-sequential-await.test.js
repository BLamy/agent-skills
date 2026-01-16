import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-sequential-await.js';

describe('no-sequential-await', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-sequential-await', rule, {
      valid: [
        {
          code: `
            async function fetchData() {
              const data = await fetch('/api');
              return data;
            }
          `,
        },
        {
          code: `
            async function fetchAll() {
              const [user, posts] = await Promise.all([
                fetchUser(),
                fetchPosts()
              ]);
              return { user, posts };
            }
          `,
        },
        {
          code: `
            async function process() {
              const a = await fetchA();
              console.log(a);
              const b = await fetchB();
              return b;
            }
          `,
        },
      ],
      invalid: [
        {
          code: `
            async function fetchAll() {
              const user = await fetchUser();
              const posts = await fetchPosts();
              return { user, posts };
            }
          `,
          errors: [{ messageId: 'sequentialAwait' }],
        },
        {
          code: `
            async function fetchAll() {
              const a = await fetchA();
              const b = await fetchB();
              const c = await fetchC();
              return { a, b, c };
            }
          `,
          errors: [{ messageId: 'sequentialAwait' }],
        },
      ],
    });
  });
});
