import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-sort-for-minmax.js';

describe('no-sort-for-minmax', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-sort-for-minmax', rule, {
      valid: [
        { code: `const max = Math.max(...numbers);` },
        { code: `const sorted = items.sort((a, b) => a - b);` },
      ],
      invalid: [
        {
          code: `const oldest = items.sort((a, b) => a.date - b.date)[0];`,
          errors: [{ messageId: 'sortForMinMax' }],
        },
        {
          code: `const newest = items.sort((a, b) => a.date - b.date)[items.length - 1];`,
          errors: [{ messageId: 'sortForMinMax' }],
        },
        {
          code: `const min = numbers.toSorted((a, b) => a - b)[0];`,
          errors: [{ messageId: 'sortForMinMax' }],
        },
      ],
    });
  });
});
