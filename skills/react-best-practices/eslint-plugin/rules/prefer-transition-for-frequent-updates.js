/**
 * Rule: prefer-transition-for-frequent-updates
 * Section: 5.7 Use Transitions for Non-Urgent Updates
 *
 * Detects setState calls inside frequent event handlers (scroll, resize, mousemove)
 * without startTransition wrapper.
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use startTransition for frequent event handler state updates',
      category: 'Performance',
      recommended: true,
    },
    fixable: null, // Would need to add import and wrap - complex
    messages: {
      useTransition:
        'setState in {{event}} handler should use startTransition to avoid blocking UI. Wrap with: startTransition(() => {{setter}}(...))',
    },
    schema: [],
  },

  create(context) {
    // Event types that fire frequently and benefit from transitions
    const FREQUENT_EVENTS = new Set([
      'scroll',
      'resize',
      'mousemove',
      'pointermove',
      'touchmove',
      'wheel',
    ]);

    /**
     * Track if we're inside a startTransition callback
     */
    let insideTransition = false;

    /**
     * Current event handler context
     */
    let currentEventHandler = null;

    /**
     * Check if a node is a setState call (setX pattern from useState)
     */
    function isSetStateCall(node) {
      if (node.type !== 'CallExpression') return false;
      const callee = node.callee;
      if (callee.type !== 'Identifier') return false;
      // Convention: setState functions start with "set" and have capital letter
      const name = callee.name;
      return /^set[A-Z]/.test(name);
    }

    /**
     * Check if this is an addEventListener call for frequent events
     */
    function getEventTypeFromAddEventListener(node) {
      if (node.type !== 'CallExpression') return null;
      if (node.callee.type !== 'MemberExpression') return null;
      if (node.callee.property.name !== 'addEventListener') return null;

      const eventArg = node.arguments[0];
      if (!eventArg) return null;

      if (eventArg.type === 'Literal' && typeof eventArg.value === 'string') {
        return eventArg.value;
      }

      return null;
    }

    /**
     * Check if we're inside startTransition call
     */
    function checkStartTransition(node) {
      if (node.type !== 'CallExpression') return false;
      const callee = node.callee;
      // startTransition(() => ...)
      if (callee.type === 'Identifier' && callee.name === 'startTransition') {
        return true;
      }
      // React.startTransition(() => ...)
      if (
        callee.type === 'MemberExpression' &&
        callee.property.name === 'startTransition'
      ) {
        return true;
      }
      return false;
    }

    return {
      // Track entry into startTransition callbacks
      CallExpression(node) {
        if (checkStartTransition(node)) {
          const callback = node.arguments[0];
          if (callback && (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')) {
            // Mark that we're entering a transition context
            // The actual flag is set in the function entry handlers below
          }
        }

        // Check for addEventListener with frequent events
        const eventType = getEventTypeFromAddEventListener(node);
        if (eventType && FREQUENT_EVENTS.has(eventType)) {
          const handler = node.arguments[1];
          if (handler) {
            // We'll check the handler in the function handlers
          }
        }

        // Check setState calls
        if (isSetStateCall(node) && currentEventHandler && !insideTransition) {
          context.report({
            node,
            messageId: 'useTransition',
            data: {
              event: currentEventHandler,
              setter: node.callee.name,
            },
          });
        }
      },

      // Track addEventListener patterns
      'CallExpression > ArrowFunctionExpression, CallExpression > FunctionExpression'(node) {
        const parent = node.parent;
        if (!parent || parent.type !== 'CallExpression') return;

        // Check if this is inside startTransition
        if (checkStartTransition(parent)) {
          insideTransition = true;
          return;
        }

        // Check if this is an event handler for frequent events
        const eventType = getEventTypeFromAddEventListener(parent);
        if (eventType && FREQUENT_EVENTS.has(eventType)) {
          currentEventHandler = eventType;
        }
      },

      'CallExpression > ArrowFunctionExpression:exit, CallExpression > FunctionExpression:exit'(node) {
        const parent = node.parent;
        if (!parent || parent.type !== 'CallExpression') return;

        if (checkStartTransition(parent)) {
          insideTransition = false;
          return;
        }

        const eventType = getEventTypeFromAddEventListener(parent);
        if (eventType && FREQUENT_EVENTS.has(eventType)) {
          currentEventHandler = null;
        }
      },
    };
  },
};
