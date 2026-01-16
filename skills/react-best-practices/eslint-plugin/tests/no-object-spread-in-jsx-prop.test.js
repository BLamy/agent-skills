import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-object-spread-in-jsx-prop.js';

describe('no-object-spread-in-jsx-prop', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-object-spread-in-jsx-prop', rule, {
      valid: [
        { code: `<Profile name={user.name} email={user.email} />` },
        { code: `<Avatar src={user.avatar} />` },
        { code: `<Button onClick={handleClick}>Click</Button>` },
        {
          code: `<Input {...inputProps} />`,
          options: [{ allowedComponents: ['Input'] }],
        },
      ],
      invalid: [
        {
          code: `<Profile {...user} />`,
          errors: [{ messageId: 'avoidSpread' }],
        },
        {
          code: `<Profile {...data.user} />`,
          errors: [{ messageId: 'avoidSpread' }],
        },
        {
          code: `<Form {...formProps} {...extraProps} />`,
          errors: [
            { messageId: 'avoidSpread' },
            { messageId: 'avoidSpread' },
          ],
        },
      ],
    });
  });
});
