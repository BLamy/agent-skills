import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-tosorted.js';

describe('prefer-tosorted', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-tosorted', rule, {
      valid: [
        { code: `const sorted = items.toSorted((a, b) => a - b);` },
        { code: `const sorted = [...items].sort((a, b) => a - b);` },
      ],
      invalid: [
        {
          code: `const sorted = items.sort((a, b) => a - b);`,
          errors: [{ messageId: 'preferToSorted' }],
          output: `const sorted = items.toSorted((a, b) => a - b);`,
        },
        {
          code: `const sorted = names.sort();`,
          errors: [{ messageId: 'preferToSorted' }],
          output: `const sorted = names.toSorted();`,
        },
      ],
    });
  });
});
