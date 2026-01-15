import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-narrow-dependencies.js';

describe('prefer-narrow-dependencies', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-narrow-dependencies', rule, {
      valid: [
        {
          code: `
            useEffect(() => {
              console.log(user.id);
            }, [user.id]);
          `,
        },
        {
          code: `
            useEffect(() => {
              console.log('mounted');
            }, []);
          `,
        },
        {
          code: `
            useEffect(() => {
              console.log(id);
            }, [id]);
          `,
        },
      ],
      invalid: [
        {
          code: `
            useEffect(() => {
              console.log(user.id);
            }, [user]);
          `,
          errors: [{ messageId: 'narrowDependency' }],
        },
        {
          code: `
            useMemo(() => {
              return config.apiUrl;
            }, [config]);
          `,
          errors: [{ messageId: 'narrowDependency' }],
        },
      ],
    });
  });
});
