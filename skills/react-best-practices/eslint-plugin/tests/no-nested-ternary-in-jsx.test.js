import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-nested-ternary-in-jsx.js';

describe('no-nested-ternary-in-jsx', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-nested-ternary-in-jsx', rule, {
      valid: [
        {
          // Single ternary is OK
          code: `<div>{isLoading ? <Spinner /> : <Content />}</div>`,
        },
        {
          // Using && is OK
          code: `<div>{isLoggedIn && <Dashboard />}</div>`,
        },
        {
          // Ternary outside JSX is OK (different rule handles this)
          code: `
            const result = a ? (b ? 'nested' : 'b') : 'a';
            return <div>{result}</div>;
          `,
        },
        {
          // Using variables for complex conditions
          code: `
            const content = status === 'loading' ? <Spinner /> : <Data />;
            return <div>{content}</div>;
          `,
        },
      ],
      invalid: [
        {
          // Nested ternary in JSX
          code: `<div>{a ? (b ? <B /> : <NotB />) : <NotA />}</div>`,
          errors: [{ messageId: 'noNestedTernary' }],
        },
        {
          // Nested ternary in alternate branch
          code: `<div>{isLoading ? <Spinner /> : (hasError ? <Error /> : <Content />)}</div>`,
          errors: [{ messageId: 'noNestedTernary' }],
        },
        {
          // Deeply nested
          code: `
            <Container>
              {status === 'loading'
                ? <Spinner />
                : status === 'error'
                  ? <Error />
                  : <Content />
              }
            </Container>
          `,
          errors: [{ messageId: 'noNestedTernary' }],
        },
      ],
    });
  });
});
