import { ruleTester } from './rule-tester.js';
import rule from '../rules/cache-loop-length.js';

describe('cache-loop-length', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('cache-loop-length', rule, {
      valid: [
        {
          // Length is cached
          code: `
            const len = arr.length;
            for (let i = 0; i < len; i++) {
              console.log(arr[i]);
            }
          `,
        },
        {
          // Using for-of (no length access)
          code: `
            for (const item of arr) {
              console.log(item);
            }
          `,
        },
        {
          // Comparison with a number
          code: `
            for (let i = 0; i < 10; i++) {
              console.log(i);
            }
          `,
        },
      ],
      invalid: [
        {
          code: `for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}`,
          output: `const arrLen = arr.length;
for (let i = 0; i < arrLen; i++) {
  console.log(arr[i]);
}`,
          errors: [{ messageId: 'cacheLengthInLoop' }],
        },
        {
          code: `for (let i = 0; i < items.length; i++) {
  process(items[i]);
}`,
          output: `const itemsLen = items.length;
for (let i = 0; i < itemsLen; i++) {
  process(items[i]);
}`,
          errors: [{ messageId: 'cacheLengthInLoop' }],
        },
      ],
    });
  });
});
