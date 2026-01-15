import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-length-check-first.js';

describe('prefer-length-check-first', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-length-check-first', rule, {
      valid: [
        {
          // Has length check before expensive operation
          code: `
            function hasChanges(current, original) {
              if (current.length !== original.length) return true;
              return current.sort().join() !== original.sort().join();
            }
          `,
        },
        {
          // Single array operation (not a comparison)
          code: `
            function sortArray(items) {
              return items.sort();
            }
          `,
        },
        {
          // Not comparing arrays
          code: `
            function process(data) {
              console.log(data);
            }
          `,
        },
      ],
      invalid: [
        {
          // sort().join() comparison without length check
          code: `
            function hasChanges(current, original) {
              return current.sort().join() !== original.sort().join();
            }
          `,
          errors: [{ messageId: 'missingLengthCheck' }],
        },
        {
          // JSON.stringify comparison without length check
          code: `
            function arraysEqual(arr1, arr2) {
              return JSON.stringify(arr1) === JSON.stringify(arr2);
            }
          `,
          errors: [{ messageId: 'missingLengthCheck' }],
        },
        {
          // Arrow function with sort comparison
          code: `
            const hasChanges = (current, original) => {
              return current.toSorted().join() !== original.toSorted().join();
            };
          `,
          errors: [{ messageId: 'missingLengthCheck' }],
        },
      ],
    });
  });
});
