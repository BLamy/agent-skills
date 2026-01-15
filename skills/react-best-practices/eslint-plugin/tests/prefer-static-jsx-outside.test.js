import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-static-jsx-outside.js';

describe('prefer-static-jsx-outside', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-static-jsx-outside', rule, {
      valid: [
        {
          // Dynamic props - can't hoist
          code: `
            function Component({ name }) {
              return <div className={name}>Hello</div>;
            }
          `,
        },
        {
          // Root return element - shouldn't be flagged
          code: `
            function Component() {
              return <div className="container">Content</div>;
            }
          `,
        },
        {
          // Simple element without className - not worth hoisting
          code: `
            function Component() {
              return <div><span>Text</span></div>;
            }
          `,
        },
        {
          // Already hoisted outside
          code: `
            const skeleton = <div className="animate-pulse h-20 bg-gray-200" />;
            function Component() {
              return <div>{skeleton}</div>;
            }
          `,
        },
      ],
      invalid: [
        {
          // Static JSX with className inside conditional
          code: `
            function Component({ loading }) {
              return (
                <div>
                  {loading && <div className="animate-pulse h-20 bg-gray-200" />}
                </div>
              );
            }
          `,
          errors: [{ messageId: 'hoistStaticJsx' }],
        },
        {
          // Static JSX with multiple attributes
          code: `
            function Component({ show }) {
              return (
                <div>
                  {show && <div id="loader" className="spinner" />}
                </div>
              );
            }
          `,
          errors: [{ messageId: 'hoistStaticJsx' }],
        },
      ],
    });
  });
});
