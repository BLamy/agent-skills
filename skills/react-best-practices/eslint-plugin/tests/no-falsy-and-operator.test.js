import { ruleTester } from './rule-tester.js';
import rule from '../rules/no-falsy-and-operator.js';

describe('no-falsy-and-operator', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('no-falsy-and-operator', rule, {
      valid: [
        { code: `<div>{count > 0 && <Badge>{count}</Badge>}</div>` },
        { code: `<div>{count > 0 ? <Badge>{count}</Badge> : null}</div>` },
        { code: `<div>{isVisible && <Modal />}</div>` },
        { code: `<div>{items.length > 0 && <List items={items} />}</div>` },
        { code: `<div>{!!count && <Badge>{count}</Badge>}</div>` },
      ],
      invalid: [
        {
          code: `<div>{items.length && <List items={items} />}</div>`,
          errors: [{ messageId: 'falsyAnd' }],
        },
        {
          code: `<div>{count && <Badge>{count}</Badge>}</div>`,
          errors: [{ messageId: 'falsyAnd' }],
        },
        {
          code: `<div>{total && <Total value={total} />}</div>`,
          errors: [{ messageId: 'falsyAnd' }],
        },
      ],
    });
  });
});
