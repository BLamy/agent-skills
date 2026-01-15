import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-regexp-in-render.js';

describe('no-regexp-in-render', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-regexp-in-render', rule, {
      valid: [
        {
          code: `
            const EMAIL_REGEX = /test/;
            function Component() {
              return <div>{EMAIL_REGEX.test(email)}</div>;
            }
          `,
        },
        {
          code: `
            function Highlighter({ query }) {
              const regex = useMemo(() => new RegExp(query), [query]);
              return <div>{regex.test(text)}</div>;
            }
          `,
        },
        {
          code: `
            function handleSearch(query) {
              const regex = new RegExp(query);
              return data.filter(item => regex.test(item.name));
            }
          `,
        },
      ],
      invalid: [
        {
          code: `
            function SearchHighlight({ query }) {
              const regex = new RegExp(query);
              return <div>{regex.test(text)}</div>;
            }
          `,
          errors: [{ messageId: 'regexpInRender' }],
        },
        {
          code: `
            const Highlighter = ({ query }) => {
              const regex = new RegExp(query);
              return <span>{regex.test(text)}</span>;
            };
          `,
          errors: [{ messageId: 'regexpInRender' }],
        },
        {
          code: `
            function EmailValidator() {
              const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
              return <input pattern={emailRegex.source} />;
            }
          `,
          output: `
            function EmailValidator() {
              const emailRegex = useMemo(() => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/, []);
              return <input pattern={emailRegex.source} />;
            }
          `,
          errors: [{ messageId: 'regexpLiteralInRender' }],
        },
      ],
    });
  });
});
