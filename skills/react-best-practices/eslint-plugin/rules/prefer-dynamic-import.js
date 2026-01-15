/**
 * Rule: prefer-dynamic-import
 * Section: 2.4 Dynamic Imports for Heavy Components
 *
 * Detects static imports of known heavy libraries that should be dynamically imported.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use dynamic imports for heavy libraries',
      category: 'Performance',
      recommended: true,
    },
    messages: {
      preferDynamic:
        '"{{module}}" is a heavy library ({{size}}). Consider using dynamic import with next/dynamic or React.lazy() to reduce initial bundle size.',
      preferDynamicGeneric:
        '"{{module}}" is a heavy library. Consider using dynamic import to reduce initial bundle size.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          heavyModules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                size: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    // Default list of heavy modules
    const defaultHeavyModules = [
      { name: 'monaco-editor', size: '~2MB' },
      { name: '@monaco-editor/react', size: '~2MB' },
      { name: 'chart.js', size: '~200KB' },
      { name: 'react-chartjs-2', size: '~200KB' },
      { name: 'recharts', size: '~500KB' },
      { name: 'd3', size: '~500KB' },
      { name: 'three', size: '~600KB' },
      { name: '@react-three/fiber', size: '~600KB' },
      { name: 'pdfjs-dist', size: '~1MB' },
      { name: 'react-pdf', size: '~1MB' },
      { name: '@react-pdf/renderer', size: '~1MB' },
      { name: 'xlsx', size: '~500KB' },
      { name: 'sheetjs', size: '~500KB' },
      { name: 'highlight.js', size: '~300KB' },
      { name: 'prismjs', size: '~200KB' },
      { name: 'codemirror', size: '~500KB' },
      { name: '@codemirror/state', size: '~500KB' },
      { name: 'draft-js', size: '~200KB' },
      { name: 'slate', size: '~200KB' },
      { name: 'slate-react', size: '~200KB' },
      { name: 'quill', size: '~300KB' },
      { name: 'react-quill', size: '~300KB' },
      { name: 'tiptap', size: '~200KB' },
      { name: '@tiptap/react', size: '~200KB' },
      { name: 'mapbox-gl', size: '~700KB' },
      { name: 'react-map-gl', size: '~700KB' },
      { name: 'leaflet', size: '~200KB' },
      { name: 'react-leaflet', size: '~200KB' },
      { name: 'firebase', size: '~300KB' },
      { name: 'aws-sdk', size: '~1MB' },
      { name: '@aws-sdk/client-s3', size: '~500KB' },
      { name: 'moment', size: '~300KB' },
      { name: 'moment-timezone', size: '~500KB' },
      { name: 'luxon', size: '~100KB' },
      { name: 'video.js', size: '~500KB' },
      { name: 'plyr', size: '~200KB' },
      { name: 'framer-motion', size: '~150KB' },
      { name: '@splinetool/react-spline', size: '~500KB' },
      { name: 'lottie-web', size: '~300KB' },
      { name: 'react-lottie', size: '~300KB' },
    ];

    const userModules = context.options[0]?.heavyModules ?? [];
    const heavyModules = new Map(
      [...defaultHeavyModules, ...userModules].map((m) => [m.name, m.size])
    );

    return {
      ImportDeclaration(node) {
        const moduleName = node.source.value;

        // Check for exact match
        if (heavyModules.has(moduleName)) {
          const size = heavyModules.get(moduleName);
          context.report({
            node,
            messageId: size ? 'preferDynamic' : 'preferDynamicGeneric',
            data: { module: moduleName, size },
          });
          return;
        }

        // Check for sub-paths like '@monaco-editor/react/lib/...'
        for (const [name, size] of heavyModules.entries()) {
          if (moduleName.startsWith(name + '/')) {
            context.report({
              node,
              messageId: size ? 'preferDynamic' : 'preferDynamicGeneric',
              data: { module: name, size },
            });
            return;
          }
        }
      },
    };
  },
};
