import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-early-return.js';

describe('prefer-early-return', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-early-return', rule, {
      valid: [
        {
          // Early return pattern (good)
          code: `
            function process(data) {
              if (!data) return null;
              if (!data.valid) return { error: 'invalid' };
              return transform(data);
            }
          `,
        },
        {
          // Shallow nesting (acceptable)
          code: `
            function process(data) {
              if (data) {
                if (data.valid) {
                  return data.value;
                }
              }
              return null;
            }
          `,
        },
        {
          // if-else-if chain (different pattern)
          code: `
            function getType(value) {
              if (value === 1) {
                return 'one';
              } else if (value === 2) {
                return 'two';
              } else {
                return 'other';
              }
            }
          `,
        },
      ],
      invalid: [
        {
          // Deeply nested (3 levels)
          code: `
            function process(data) {
              if (data) {
                if (data.valid) {
                  if (data.active) {
                    return data.value;
                  }
                }
              }
              return null;
            }
          `,
          errors: [{ messageId: 'preferEarlyReturn' }],
        },
        {
          // Custom maxDepth = 2
          code: `
            function process(data) {
              if (data) {
                if (data.valid) {
                  return data.value;
                }
              }
              return null;
            }
          `,
          options: [{ maxDepth: 2 }],
          errors: [{ messageId: 'preferEarlyReturn' }],
        },
      ],
    });
  });
});
