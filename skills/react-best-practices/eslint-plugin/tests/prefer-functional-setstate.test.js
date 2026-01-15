import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-functional-setstate.js';

describe('prefer-functional-setstate', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-functional-setstate', rule, {
      valid: [
        {
          code: `
            const [items, setItems] = useState([]);
            setItems(prev => [...prev, newItem]);
          `,
        },
        {
          code: `
            const [count, setCount] = useState(0);
            setCount(5);
          `,
        },
        {
          code: `
            const [text, setText] = useState('');
            setText(e.target.value);
          `,
        },
      ],
      invalid: [
        {
          code: `
            const [items, setItems] = useState([]);
            setItems([...items, newItem]);
          `,
          errors: [{ messageId: 'preferFunctional' }],
        },
        {
          code: `
            const [count, setCount] = useState(0);
            setCount(count + 1);
          `,
          errors: [{ messageId: 'preferFunctional' }],
        },
      ],
    });
  });
});
