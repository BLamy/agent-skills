import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-uncached-storage.js';

describe('no-uncached-storage', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-uncached-storage', rule, {
      valid: [
        {
          code: `
            function getTheme() {
              return localStorage.getItem('theme');
            }
          `,
        },
        {
          code: `
            function getSettings() {
              const theme = localStorage.getItem('theme');
              const lang = localStorage.getItem('lang');
              return { theme, lang };
            }
          `,
        },
      ],
      invalid: [
        {
          code: `
            function Component() {
              const a = localStorage.getItem('theme');
              const b = localStorage.getItem('theme');
              return a + b;
            }
          `,
          errors: [{ messageId: 'uncachedStorage' }],
        },
      ],
    });
  });
});
