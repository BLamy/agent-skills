import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-transition-for-frequent-updates.js';

describe('prefer-transition-for-frequent-updates', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-transition-for-frequent-updates', rule, {
      valid: [
        {
          // Using startTransition in scroll handler
          code: `
            window.addEventListener('scroll', () => {
              startTransition(() => setScrollY(window.scrollY));
            });
          `,
        },
        {
          // Non-frequent event (click) - doesn't need transition
          code: `
            button.addEventListener('click', () => {
              setCount(count + 1);
            });
          `,
        },
        {
          // No setState call
          code: `
            window.addEventListener('scroll', () => {
              console.log(window.scrollY);
            });
          `,
        },
      ],
      invalid: [
        {
          // scroll handler without startTransition
          code: `
            window.addEventListener('scroll', () => {
              setScrollY(window.scrollY);
            });
          `,
          errors: [{ messageId: 'useTransition' }],
        },
        {
          // resize handler without startTransition
          code: `
            window.addEventListener('resize', () => {
              setWidth(window.innerWidth);
            });
          `,
          errors: [{ messageId: 'useTransition' }],
        },
        {
          // mousemove handler without startTransition
          code: `
            element.addEventListener('mousemove', (e) => {
              setPosition({ x: e.clientX, y: e.clientY });
            });
          `,
          errors: [{ messageId: 'useTransition' }],
        },
      ],
    });
  });
});
