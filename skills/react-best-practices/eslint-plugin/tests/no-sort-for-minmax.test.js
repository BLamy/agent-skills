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
          // Simple numeric array - ascending [0] = min (auto-fixable)
          code: `const min = numbers.sort((a, b) => a - b)[0];`,
          output: `const min = Math.min(...numbers);`,
          errors: [{ messageId: 'sortForMinMax' }],
        },
        {
          // Simple numeric array - descending [0] = max (auto-fixable)
          code: `const max = numbers.sort((a, b) => b - a)[0];`,
          output: `const max = Math.max(...numbers);`,
          errors: [{ messageId: 'sortForMinMax' }],
        },
        {
          // Object comparator - no auto-fix
          code: `const oldest = items.sort((a, b) => a.date - b.date)[0];`,
          errors: [{ messageId: 'sortForMinMax' }],
        },
        {
          // toSorted - ascending [0] = min (auto-fixable)
          code: `const min = nums.toSorted((a, b) => a - b)[0];`,
          output: `const min = Math.min(...nums);`,
          errors: [{ messageId: 'sortForMinMax' }],
        },
      ],
    });
  });
});
