import { ruleTester } from './rule-tester.js';
import rule from '../rules/prefer-dynamic-import.js';

describe('prefer-dynamic-import', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('prefer-dynamic-import', rule, {
      valid: [
        { code: `import React from 'react';` },
        { code: `import { useState } from 'react';` },
        { code: `import dynamic from 'next/dynamic';` },
        { code: `import { debounce } from 'lodash/debounce';` },
      ],
      invalid: [
        {
          code: `import { MonacoEditor } from 'monaco-editor';`,
          errors: [{ messageId: 'preferDynamic' }],
        },
        {
          code: `import Chart from 'chart.js';`,
          errors: [{ messageId: 'preferDynamic' }],
        },
        {
          code: `import * as THREE from 'three';`,
          errors: [{ messageId: 'preferDynamic' }],
        },
        {
          code: `import { LineChart } from 'recharts';`,
          errors: [{ messageId: 'preferDynamic' }],
        },
        {
          code: `import { motion } from 'framer-motion';`,
          errors: [{ messageId: 'preferDynamic' }],
        },
      ],
    });
  });
});
