import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-lazy-state-init.js';

describe('prefer-lazy-state-init', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-lazy-state-init', rule, {
      valid: [
        { code: `const [count, setCount] = useState(0);` },
        { code: `const [name, setName] = useState('');` },
        { code: `const [data, setData] = useState(() => expensiveFn());` },
        { code: `const [items, setItems] = useState([]);` },
        { code: `const [map, setMap] = useState(new Map());` },
      ],
      invalid: [
        {
          code: `const [data, setData] = useState(expensiveFn());`,
          errors: [{ messageId: 'preferLazyInitSimple' }],
          output: `const [data, setData] = useState(() => expensiveFn());`,
        },
        {
          code: `const [settings, setSettings] = useState(JSON.parse(stored));`,
          errors: [{ messageId: 'preferLazyInitSimple' }],
          output: `const [settings, setSettings] = useState(() => JSON.parse(stored));`,
        },
        {
          code: `const [theme, setTheme] = useState(localStorage.getItem('theme'));`,
          errors: [{ messageId: 'preferLazyInitSimple' }],
          output: `const [theme, setTheme] = useState(() => localStorage.getItem('theme'));`,
        },
      ],
    });
  });
});
