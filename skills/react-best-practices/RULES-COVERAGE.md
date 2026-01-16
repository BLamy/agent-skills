# ESLint Rules Coverage for React Best Practices

This document maps each rule from the React Best Practices guide to its ESLint coverage status.

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully covered by ESLint (custom or built-in rule) |
| ⚠️ | Partially covered by ESLint |
| ❌ | Not covered by ESLint (requires manual review or custom tooling) |

---

## Summary

| Section | Rules | Covered | Partial | Not Covered |
|---------|-------|---------|---------|-------------|
| 1. Eliminating Waterfalls | 5 | 2 | 1 | 2 |
| 2. Bundle Size Optimization | 5 | 2 | 0 | 3 |
| 3. Server-Side Performance | 5 | 0 | 1 | 4 |
| 4. Client-Side Data Fetching | 2 | 0 | 0 | 2 |
| 5. Re-render Optimization | 7 | 4 | 1 | 2 |
| 6. Rendering Performance | 7 | 3 | 0 | 4 |
| 7. JavaScript Performance | 12 | 10 | 0 | 2 |
| 8. Advanced Patterns | 2 | 0 | 0 | 2 |
| **Total** | **45** | **21** | **3** | **21** |

**Coverage improved from 4% to 47% with custom rules!**

---

## Custom ESLint Plugin: `eslint-plugin-react-best-practices`

The custom plugin provides 21 rules covering patterns that can be statically analyzed:

```javascript
// eslint.config.js
import reactBestPracticesPlugin from './eslint-plugin/index.js';

export default [{
  plugins: {
    'react-best-practices': reactBestPracticesPlugin,
  },
  rules: {
    'react-best-practices/no-sequential-await': 'warn',
    // ... see eslint.config.js for all rules
  }
}];
```

---

## Section 1: Eliminating Waterfalls (CRITICAL)

### ✅ 1.1 Defer Await Until Needed (`async-defer-await`)
**ESLint Rule:** `react-best-practices/no-await-before-condition`

Detects await statements followed by early return conditions that don't use the awaited value.

```javascript
// Triggers warning:
async function handle(userId, skip) {
  const data = await fetchData(userId)  // ⚠️ Await before condition
  if (skip) return { skipped: true }    // Doesn't use 'data'
  return processData(data)
}
```

---

### ⚠️ 1.2 Dependency-Based Parallelization (`async-dependencies`)
**ESLint Status:** Partially covered by `no-sequential-await`

**Why Partial:** The rule detects sequential awaits but cannot determine if operations have partial dependencies that could use `better-all`.

---

### ❌ 1.3 Prevent Waterfall Chains in API Routes (`async-api-routes`)
**ESLint Status:** Not covered

**Why:** Detecting the optimal pattern (start promise early, await late) requires understanding the full data flow.

---

### ✅ 1.4 Promise.all() for Independent Operations (`async-parallel`)
**ESLint Rule:** `react-best-practices/no-sequential-await`

Detects consecutive await statements that could potentially be parallelized.

```javascript
// Triggers warning:
async function fetchAll() {
  const user = await fetchUser()     // ⚠️ Sequential awaits detected
  const posts = await fetchPosts()   // Could use Promise.all()
  const comments = await fetchComments()
}
```

---

### ❌ 1.5 Strategic Suspense Boundaries (`async-suspense-boundaries`)
**ESLint Status:** Not covered

**Why:** Optimal Suspense placement requires understanding UX priorities.

---

## Section 2: Bundle Size Optimization (CRITICAL)

### ✅ 2.1 Avoid Barrel File Imports (`bundle-barrel-imports`)
**ESLint Rule:** Built-in `no-restricted-imports`

Configured to warn against barrel imports from common heavy libraries.

```javascript
// Triggers error:
import { Check } from 'lucide-react'  // ❌ Use direct import
import { Button } from '@mui/material' // ❌ Use @mui/material/Button
```

---

### ❌ 2.2 Conditional Module Loading (`bundle-conditional`)
**ESLint Status:** Not covered

**Why:** Determining when to conditionally load requires runtime context.

---

### ❌ 2.3 Defer Non-Critical Third-Party Libraries (`bundle-defer-third-party`)
**ESLint Status:** Not covered

**Why:** Determining which libraries are "non-critical" requires understanding application requirements.

---

### ✅ 2.4 Dynamic Imports for Heavy Components (`bundle-dynamic-imports`)
**ESLint Rule:** `react-best-practices/prefer-dynamic-import`

Warns when importing known heavy libraries that should use dynamic imports.

```javascript
// Triggers warning:
import { MonacoEditor } from 'monaco-editor'  // ⚠️ ~2MB, use dynamic import
import Chart from 'chart.js'                   // ⚠️ ~200KB, use dynamic import
```

**Includes 40+ heavy libraries by default**, including Monaco, Chart.js, Three.js, PDF.js, etc.

---

### ❌ 2.5 Preload Based on User Intent (`bundle-preload`)
**ESLint Status:** Not covered

**Why:** This is a design pattern, not a detectable anti-pattern.

---

## Section 3: Server-Side Performance (HIGH)

### ❌ 3.1 Cross-Request LRU Caching (`server-cache-lru`)
**ESLint Status:** Not covered

---

### ⚠️ 3.2 Minimize Serialization at RSC Boundaries (`server-serialization`)
**ESLint Rule:** `react-best-practices/no-object-spread-in-jsx-prop` (off by default)

Detects spreading entire objects as props, which can over-serialize in RSC.

```javascript
// Triggers warning when enabled:
<Profile {...user} />  // ⚠️ Pass only needed fields: <Profile name={user.name} />
```

**Why Partial:** Cannot determine which fields are actually used by the component.

---

### ❌ 3.3 Parallel Data Fetching with Component Composition (`server-parallel-fetching`)
**ESLint Status:** Not covered

---

### ❌ 3.4 Per-Request Deduplication with React.cache() (`server-cache-react`)
**ESLint Status:** Not covered

---

### ❌ 3.5 Use after() for Non-Blocking Operations (`server-after-nonblocking`)
**ESLint Status:** Not covered

---

## Section 4: Client-Side Data Fetching (MEDIUM-HIGH)

### ❌ 4.1 Deduplicate Global Event Listeners (`client-event-listeners`)
**ESLint Status:** Not covered

---

### ❌ 4.2 Use SWR for Automatic Deduplication (`client-swr-dedup`)
**ESLint Status:** Not covered

---

## Section 5: Re-render Optimization (MEDIUM)

### ❌ 5.1 Defer State Reads to Usage Point (`rerender-defer-reads`)
**ESLint Status:** Not covered

---

### ❌ 5.2 Extract to Memoized Components (`rerender-memo`)
**ESLint Status:** Not covered

---

### ⚠️ 5.3 Narrow Effect Dependencies (`rerender-dependencies`)
**ESLint Rule:** `react-best-practices/prefer-narrow-dependencies`

Detects object dependencies when only specific properties are used.

```javascript
// Triggers warning:
useEffect(() => {
  console.log(user.id)
}, [user])  // ⚠️ Use [user.id] instead
```

**Why Partial:** May have false positives when object identity matters.

---

### ❌ 5.4 Subscribe to Derived State (`rerender-derived-state`)
**ESLint Status:** Not covered

---

### ✅ 5.5 Use Functional setState Updates (`rerender-functional-setstate`)
**ESLint Rule:** `react-best-practices/prefer-functional-setstate`

Detects setState calls that reference state directly instead of using functional updates.

```javascript
// Triggers warning:
const [items, setItems] = useState([])
setItems([...items, newItem])  // ⚠️ Use: setItems(prev => [...prev, newItem])
```

---

### ✅ 5.6 Use Lazy State Initialization (`rerender-lazy-state-init`)
**ESLint Rule:** `react-best-practices/prefer-lazy-state-init`

Detects useState with function calls that should use lazy initialization.

```javascript
// Triggers warning:
useState(expensiveFn())           // ⚠️ Use: useState(() => expensiveFn())
useState(JSON.parse(stored))      // ⚠️ Use: useState(() => JSON.parse(stored))
useState(localStorage.getItem()) // ⚠️ Use: useState(() => localStorage.getItem())
```

**Auto-fixable!**

---

### ✅ 5.7 Use Transitions for Non-Urgent Updates (`rerender-transitions`)
**ESLint Rule:** `react-best-practices/prefer-transition-for-frequent-updates`

Detects setState calls in frequent event handlers (scroll, resize, mousemove) without startTransition.

```javascript
// Triggers warning:
window.addEventListener('scroll', () => {
  setScrollY(window.scrollY)  // ⚠️ Blocks UI on every scroll
});

// Correct:
window.addEventListener('scroll', () => {
  startTransition(() => setScrollY(window.scrollY))
});
```

---

## Section 6: Rendering Performance (MEDIUM)

### ❌ 6.1 Animate SVG Wrapper Instead of SVG Element (`rendering-animate-svg-wrapper`)
**ESLint Status:** Not covered

---

### ❌ 6.2 CSS content-visibility for Long Lists (`rendering-content-visibility`)
**ESLint Status:** Not covered (CSS)

---

### ✅ 6.3 Hoist Static JSX Elements (`rendering-hoist-jsx`)
**ESLint Rule:** `react-best-practices/prefer-static-jsx-outside` (off by default)

Detects static JSX elements inside components that could be hoisted outside to avoid re-creation.

```javascript
// Triggers warning when enabled:
function Component({ loading }) {
  return (
    <div>
      {loading && <div className="animate-pulse h-20 bg-gray-200" />}
    </div>
  );
}

// Better: hoist outside
const skeleton = <div className="animate-pulse h-20 bg-gray-200" />;
function Component({ loading }) {
  return <div>{loading && skeleton}</div>;
}
```

**Note:** React Compiler handles this automatically, so this rule is off by default.

---

### ❌ 6.4 Optimize SVG Precision (`rendering-svg-precision`)
**ESLint Status:** Not covered (use SVGO)

---

### ❌ 6.5 Prevent Hydration Mismatch Without Flickering (`rendering-hydration-no-flicker`)
**ESLint Status:** Not covered

---

### ❌ 6.6 Use Activity Component for Show/Hide (`rendering-activity`)
**ESLint Status:** Not covered

---

### ✅ 6.7 Use Explicit Conditional Rendering (`rendering-conditional-render`)
**ESLint Rule:** `react-best-practices/no-falsy-and-operator`

Detects && operators with values that might render 0 or NaN.

```javascript
// Triggers error:
{count && <Badge>{count}</Badge>}        // ❌ Renders "0" when count is 0
{items.length && <List items={items} />} // ❌ Renders "0" for empty array

// Correct:
{count > 0 ? <Badge>{count}</Badge> : null}
```

**Auto-fixable!**

---

### ✅ 6.8 Avoid Nested Ternaries in JSX (`rendering-nested-ternary`)
**ESLint Rule:** `react-best-practices/no-nested-ternary-in-jsx`

Detects nested ternary operators in JSX which hurt readability.

```javascript
// Triggers warning:
<div>{isLoading ? <Spinner /> : hasError ? <Error /> : <Content />}</div>

// Better: extract to variable or component
const content = isLoading ? <Spinner /> : hasError ? <Error /> : <Content />;
return <div>{content}</div>;
```

---

## Section 7: JavaScript Performance (LOW-MEDIUM)

### ❌ 7.1 Batch DOM CSS Changes (`js-batch-dom-css`)
**ESLint Status:** Not covered

---

### ✅ 7.2 Build Index Maps for Repeated Lookups (`js-index-maps`)
**ESLint Rule:** `react-best-practices/no-array-find-in-loop`

Detects .find() inside loops that should use a Map.

```javascript
// Triggers warning:
orders.map(order => ({
  user: users.find(u => u.id === order.userId)  // ⚠️ O(n²), build Map first
}))
```

**Auto-fixable!** Generates Map declaration and replaces `.find()` with `.get()`.

---

### ✅ 7.3 Cache Property Access in Loops (`js-cache-property-access`)
**ESLint Rule:** `react-best-practices/cache-loop-length` (off by default)

Detects .length access in for loop conditions that could be cached.

```javascript
// Triggers warning when enabled:
for (let i = 0; i < arr.length; i++) {  // ⚠️ .length accessed every iteration
  console.log(arr[i]);
}
// Better: const len = arr.length; for (let i = 0; i < len; i++)
```

**Auto-fixable!** Inserts length cache before loop and replaces condition.

---

### ❌ 7.4 Cache Repeated Function Calls (`js-cache-function-results`)
**ESLint Status:** Not covered

---

### ✅ 7.5 Cache Storage API Calls (`js-cache-storage`)
**ESLint Rule:** `react-best-practices/no-uncached-storage`

Detects repeated localStorage/sessionStorage calls.

```javascript
// Triggers warning:
function Component() {
  const a = localStorage.getItem('key')  // ⚠️ Multiple reads
  const b = localStorage.getItem('key')  // Cache in variable instead
}
```

---

### ⚠️ 7.6 Combine Multiple Array Iterations (`js-combine-iterations`)
**ESLint Rule:** `react-best-practices/no-multiple-array-iterations` (off by default)

Detects multiple .filter()/.map() on the same array.

```javascript
// Triggers warning when enabled:
const admins = users.filter(u => u.isAdmin)   // ⚠️ 3 iterations
const testers = users.filter(u => u.isTester) // Combine into single loop
const inactive = users.filter(u => !u.active)
```

---

### ✅ 7.7 Early Length Check for Array Comparisons (`js-length-check-first`)
**ESLint Rule:** `react-best-practices/prefer-length-check-first`

Detects array comparison functions that use expensive operations without checking length first.

```javascript
// Triggers warning:
function hasChanges(current, original) {
  return current.sort().join() !== original.sort().join()  // ⚠️ No length check
}

// Correct:
function hasChanges(current, original) {
  if (current.length !== original.length) return true;
  return current.toSorted().join() !== original.toSorted().join();
}
```

---

### ✅ 7.8 Early Return from Functions (`js-early-exit`)
**ESLint Rule:** `react-best-practices/prefer-early-return`

Detects deeply nested conditionals that could use early returns.

```javascript
// Triggers warning (depth >= 3):
function process(data) {
  if (data) {
    if (data.valid) {
      if (data.active) {  // ⚠️ Too deeply nested
        return data.value;
      }
    }
  }
}
// Better: use early returns to flatten the structure
```

---

### ✅ 7.9 Hoist RegExp Creation (`js-hoist-regexp`)
**ESLint Rule:** `react-best-practices/no-regexp-in-render`

Detects RegExp creation inside React components.

```javascript
// Triggers warning:
function Component({ query }) {
  const regex = new RegExp(query, 'i')  // ⚠️ Recreated every render
  // Use: const regex = useMemo(() => new RegExp(query, 'i'), [query])
}
```

---

### ✅ 7.10 Use Loop for Min/Max Instead of Sort (`js-min-max-loop`)
**ESLint Rule:** `react-best-practices/no-sort-for-minmax`

Detects sorting to find min/max values.

```javascript
// Triggers warning:
const latest = items.sort((a, b) => b.date - a.date)[0]  // ⚠️ O(n log n)
// Use: single loop O(n) or Math.max()
```

**Auto-fixable!** For simple numeric arrays like `arr.sort((a,b)=>a-b)[0]`, replaces with `Math.min(...arr)`.

---

### ✅ 7.11 Use Set/Map for O(1) Lookups (`js-set-map-lookups`)
**ESLint Rule:** `react-best-practices/no-includes-in-loop`

Detects .includes() inside loops.

```javascript
// Triggers warning:
items.filter(item => allowedIds.includes(item.id))  // ⚠️ O(n²)
// Use: const allowedSet = new Set(allowedIds); allowedSet.has(item.id)
```

**Auto-fixable!** Generates Set declaration and replaces `.includes()` with `.has()`.

---

### ✅ 7.12 Use toSorted() Instead of sort() for Immutability (`js-tosorted-immutable`)
**ESLint Rule:** `react-best-practices/prefer-tosorted`

Detects .sort() which mutates arrays.

```javascript
// Triggers error:
const sorted = items.sort(compareFn)  // ❌ Mutates original
// Use: items.toSorted(compareFn) or [...items].sort(compareFn)
```

**Auto-fixable!**

---

## Section 8: Advanced Patterns (LOW)

### ❌ 8.1 Store Event Handlers in Refs (`advanced-event-handler-refs`)
**ESLint Status:** Not covered

---

### ❌ 8.2 useLatest for Stable Callback Refs (`advanced-use-latest`)
**ESLint Status:** Not covered

---

## Rule Reference Table

| Rule ID | Custom Rule Name | Section | Auto-fix |
|---------|-----------------|---------|----------|
| 1.1 | `no-await-before-condition` | Waterfalls | ❌ |
| 1.4 | `no-sequential-await` | Waterfalls | ❌ |
| 2.1 | `no-restricted-imports` (built-in) | Bundle | ❌ |
| 2.4 | `prefer-dynamic-import` | Bundle | ❌ |
| 3.2 | `no-object-spread-in-jsx-prop` | Server | ❌ |
| 5.3 | `prefer-narrow-dependencies` | Re-render | ✅ |
| 5.5 | `prefer-functional-setstate` | Re-render | ✅ |
| 5.6 | `prefer-lazy-state-init` | Re-render | ✅ |
| 5.7 | `prefer-transition-for-frequent-updates` | Re-render | ❌ |
| 6.3 | `prefer-static-jsx-outside` | Rendering | ❌ |
| 6.7 | `no-falsy-and-operator` | Rendering | ✅ |
| 6.8 | `no-nested-ternary-in-jsx` | Rendering | ❌ |
| 7.2 | `no-array-find-in-loop` | JS Perf | ✅ |
| 7.3 | `cache-loop-length` | JS Perf | ✅ |
| 7.5 | `no-uncached-storage` | JS Perf | ❌ |
| 7.6 | `no-multiple-array-iterations` | JS Perf | ❌ |
| 7.7 | `prefer-length-check-first` | JS Perf | ❌ |
| 7.8 | `prefer-early-return` | JS Perf | ❌ |
| 7.9 | `no-regexp-in-render` | JS Perf | ✅ |
| 7.10 | `no-sort-for-minmax` | JS Perf | ✅ |
| 7.11 | `no-includes-in-loop` | JS Perf | ✅ |
| 7.12 | `prefer-tosorted` | JS Perf | ✅ |

---

## Installation

```bash
# Install peer dependencies
npm install -D eslint @eslint/js @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks \
  eslint-plugin-import

# Copy the eslint-plugin directory to your project
cp -r skills/react-best-practices/eslint-plugin ./

# Copy the eslint.config.js
cp skills/react-best-practices/eslint.config.js ./
```

---

## Recommendations for Maximum Coverage

1. **Use the custom plugin** - Adds 21 rules covering 47% of best practices

2. **Enable React Compiler** - Automatically handles:
   - Hoisting static JSX
   - Memoization
   - Re-render optimization

3. **Use bundle analyzers**:
   - `@next/bundle-analyzer`
   - `webpack-bundle-analyzer`

4. **Use React DevTools Profiler** - For performance issues not catchable statically

5. **TypeScript strict mode** - Catches type-related issues
