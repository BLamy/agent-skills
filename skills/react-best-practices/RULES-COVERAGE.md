# ESLint Rules Coverage for React Best Practices

This document maps each rule from the React Best Practices guide to its ESLint coverage status.

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully covered by ESLint |
| ⚠️ | Partially covered by ESLint |
| ❌ | Not covered by ESLint (requires manual review or custom tooling) |

---

## Summary

| Section | Rules | Covered | Partial | Not Covered |
|---------|-------|---------|---------|-------------|
| 1. Eliminating Waterfalls | 5 | 0 | 0 | 5 |
| 2. Bundle Size Optimization | 5 | 1 | 1 | 3 |
| 3. Server-Side Performance | 5 | 0 | 0 | 5 |
| 4. Client-Side Data Fetching | 2 | 0 | 0 | 2 |
| 5. Re-render Optimization | 7 | 1 | 2 | 4 |
| 6. Rendering Performance | 7 | 0 | 1 | 6 |
| 7. JavaScript Performance | 12 | 0 | 3 | 9 |
| 8. Advanced Patterns | 2 | 0 | 0 | 2 |
| **Total** | **45** | **2** | **7** | **36** |

---

## Section 1: Eliminating Waterfalls (CRITICAL)

### ❌ 1.1 Defer Await Until Needed (`async-defer-await`)
**ESLint Status:** Not covered

**Why:** Detecting whether an `await` could be deferred requires understanding data flow, control flow, and whether the awaited value is actually needed in each code path. This is semantic analysis beyond ESLint's capability.

**Alternative:** Code review, or custom static analysis with tools like TypeScript compiler API.

---

### ❌ 1.2 Dependency-Based Parallelization (`async-dependencies`)
**ESLint Status:** Not covered

**Why:** Detecting partial dependencies between async operations requires understanding the data flow between promises. ESLint cannot determine if operations are independent or have partial dependencies.

**Alternative:** Use `better-all` library and code review.

---

### ❌ 1.3 Prevent Waterfall Chains in API Routes (`async-api-routes`)
**ESLint Status:** Not covered

**Why:** Detecting sequential awaits that could be parallelized requires understanding which operations are independent. ESLint can detect sequential awaits but cannot determine if they can be parallelized.

**Alternative:** Code review, profiling with React DevTools.

---

### ❌ 1.4 Promise.all() for Independent Operations (`async-parallel`)
**ESLint Status:** Not covered

**Why:** Same as above - requires understanding operation independence.

**Alternative:** Code review, profiling.

---

### ❌ 1.5 Strategic Suspense Boundaries (`async-suspense-boundaries`)
**ESLint Status:** Not covered

**Why:** Determining optimal Suspense boundary placement requires understanding component hierarchy, data dependencies, and UX priorities.

**Alternative:** React DevTools profiling, manual optimization.

---

## Section 2: Bundle Size Optimization (CRITICAL)

### ✅ 2.1 Avoid Barrel File Imports (`bundle-barrel-imports`)
**ESLint Status:** Fully covered

**ESLint Rule:** `no-restricted-imports`

**Configuration:**
```javascript
'no-restricted-imports': ['error', {
  patterns: [
    { group: ['lucide-react'], message: 'Import directly...' },
    { group: ['@mui/material', '!@mui/material/*'], message: '...' },
    // ... see eslint.config.js
  ]
}]
```

**Covered Libraries:**
- `lucide-react`
- `@mui/material`
- `@mui/icons-material`
- `lodash`
- `date-fns`
- `react-icons`

---

### ⚠️ 2.2 Conditional Module Loading (`bundle-conditional`)
**ESLint Status:** Partially covered

**Why:** ESLint can detect static imports at the top of files, but cannot determine if a module should be conditionally loaded based on runtime conditions.

**Partial Coverage:** Can use `no-restricted-imports` to ban certain imports and require dynamic imports instead.

---

### ❌ 2.3 Defer Non-Critical Third-Party Libraries (`bundle-defer-third-party`)
**ESLint Status:** Not covered

**Why:** Determining which libraries are "non-critical" requires understanding the application's requirements.

**Alternative:** Manual review, bundle analysis tools.

---

### ❌ 2.4 Dynamic Imports for Heavy Components (`bundle-dynamic-imports`)
**ESLint Status:** Not covered

**Why:** Determining which components are "heavy" and should be dynamically imported requires bundle analysis.

**Alternative:** Bundle analyzer tools (webpack-bundle-analyzer, @next/bundle-analyzer).

---

### ❌ 2.5 Preload Based on User Intent (`bundle-preload`)
**ESLint Status:** Not covered

**Why:** This is a design pattern for UX optimization, not something that can be statically analyzed.

**Alternative:** Manual implementation.

---

## Section 3: Server-Side Performance (HIGH)

### ❌ 3.1 Cross-Request LRU Caching (`server-cache-lru`)
**ESLint Status:** Not covered

**Why:** Determining when to use LRU caching requires understanding data access patterns and deployment environment.

**Alternative:** Manual analysis, performance monitoring.

---

### ❌ 3.2 Minimize Serialization at RSC Boundaries (`server-serialization`)
**ESLint Status:** Not covered

**Why:** Detecting excess props passed to client components requires understanding which fields are actually used.

**Alternative:** TypeScript strict prop typing, manual review.

---

### ❌ 3.3 Parallel Data Fetching with Component Composition (`server-parallel-fetching`)
**ESLint Status:** Not covered

**Why:** Detecting server-side waterfalls in RSC requires understanding component rendering order.

**Alternative:** React DevTools, performance monitoring.

---

### ❌ 3.4 Per-Request Deduplication with React.cache() (`server-cache-react`)
**ESLint Status:** Not covered

**Why:** Determining when to use `React.cache()` requires understanding which functions are called multiple times per request.

**Alternative:** Manual analysis, code review.

---

### ❌ 3.5 Use after() for Non-Blocking Operations (`server-after-nonblocking`)
**ESLint Status:** Not covered

**Why:** Identifying non-blocking operations (logging, analytics) that could be deferred requires semantic understanding.

**Alternative:** Code review.

---

## Section 4: Client-Side Data Fetching (MEDIUM-HIGH)

### ❌ 4.1 Deduplicate Global Event Listeners (`client-event-listeners`)
**ESLint Status:** Not covered

**Why:** Detecting duplicate event listener patterns requires understanding component composition.

**Alternative:** Code review, custom hooks.

---

### ❌ 4.2 Use SWR for Automatic Deduplication (`client-swr-dedup`)
**ESLint Status:** Not covered

**Why:** Determining when to use SWR vs raw fetch is a design decision.

**Alternative:** Team conventions, code review.

---

## Section 5: Re-render Optimization (MEDIUM)

### ❌ 5.1 Defer State Reads to Usage Point (`rerender-defer-reads`)
**ESLint Status:** Not covered

**Why:** Detecting if `useSearchParams()` is only used in callbacks requires understanding component logic flow.

**Alternative:** Manual review.

---

### ❌ 5.2 Extract to Memoized Components (`rerender-memo`)
**ESLint Status:** Not covered

**Why:** Identifying "expensive" computations that should be extracted requires performance profiling.

**Alternative:** React DevTools Profiler.

---

### ⚠️ 5.3 Narrow Effect Dependencies (`rerender-dependencies`)
**ESLint Status:** Partially covered

**ESLint Rule:** `react-hooks/exhaustive-deps`

**Why Partial:** The rule warns about missing dependencies but cannot determine if you should narrow the dependency (e.g., `user.id` vs `user`).

---

### ❌ 5.4 Subscribe to Derived State (`rerender-derived-state`)
**ESLint Status:** Not covered

**Why:** Detecting continuous value subscriptions (like `useWindowWidth()`) that could be replaced with derived booleans requires semantic analysis.

**Alternative:** Performance profiling.

---

### ⚠️ 5.5 Use Functional setState Updates (`rerender-functional-setstate`)
**ESLint Status:** Partially covered

**ESLint Rule:** `react-hooks/exhaustive-deps`

**Why Partial:** The exhaustive-deps rule will warn if state is used in a callback without being in the dependency array, which indirectly encourages functional updates. However, it doesn't explicitly require functional setState.

---

### ❌ 5.6 Use Lazy State Initialization (`rerender-lazy-state-init`)
**ESLint Status:** Not covered

**Why:** Detecting "expensive" initial state computations requires semantic understanding. ESLint cannot determine if `useState(expensiveComputation())` is expensive.

**Potential Custom Rule:** Could create a rule that warns when `useState` is called with a function invocation instead of a function reference.

---

### ✅ 5.7 Use Transitions for Non-Urgent Updates (`rerender-transitions`)
**ESLint Status:** Not covered

**Why:** Determining which updates are "non-urgent" requires understanding UX requirements.

**Alternative:** Manual optimization.

---

## Section 6: Rendering Performance (MEDIUM)

### ❌ 6.1 Animate SVG Wrapper Instead of SVG Element (`rendering-animate-svg-wrapper`)
**ESLint Status:** Not covered

**Why:** Detecting animated SVGs and suggesting wrapper elements requires understanding CSS animation usage.

**Alternative:** Manual review.

---

### ❌ 6.2 CSS content-visibility for Long Lists (`rendering-content-visibility`)
**ESLint Status:** Not covered

**Why:** This is a CSS optimization, not JavaScript.

**Alternative:** CSS linters, manual review.

---

### ❌ 6.3 Hoist Static JSX Elements (`rendering-hoist-jsx`)
**ESLint Status:** Not covered

**Why:** Detecting static JSX that could be hoisted requires understanding if the JSX depends on props/state.

**Note:** React Compiler handles this automatically.

**Alternative:** React Compiler, manual optimization.

---

### ❌ 6.4 Optimize SVG Precision (`rendering-svg-precision`)
**ESLint Status:** Not covered

**Why:** This is about SVG file content, not JavaScript.

**Alternative:** SVGO tool (`npx svgo --precision=1`).

---

### ❌ 6.5 Prevent Hydration Mismatch Without Flickering (`rendering-hydration-no-flicker`)
**ESLint Status:** Not covered

**Why:** Detecting hydration mismatch patterns requires understanding SSR vs client rendering.

**Alternative:** Manual review, Next.js warnings.

---

### ❌ 6.6 Use Activity Component for Show/Hide (`rendering-activity`)
**ESLint Status:** Not covered

**Why:** Detecting expensive components that toggle visibility requires performance analysis.

**Alternative:** React DevTools Profiler.

---

### ⚠️ 6.7 Use Explicit Conditional Rendering (`rendering-conditional-render`)
**ESLint Status:** Partially covered

**ESLint Rule:** `no-restricted-syntax` (custom selector)

**Configuration:**
```javascript
'no-restricted-syntax': ['warn', {
  selector: 'JSXExpressionContainer > LogicalExpression[operator="&&"][left.type="Identifier"]',
  message: 'Avoid using && for conditional rendering...'
}]
```

**Why Partial:** The rule warns about all `&&` usage in JSX, which may have false positives for boolean variables. It cannot determine if the left operand might be `0` or `NaN`.

---

## Section 7: JavaScript Performance (LOW-MEDIUM)

### ❌ 7.1 Batch DOM CSS Changes (`js-batch-dom-css`)
**ESLint Status:** Not covered

**Why:** Detecting multiple style mutations that should be batched requires control flow analysis.

**Alternative:** Manual review.

---

### ❌ 7.2 Build Index Maps for Repeated Lookups (`js-index-maps`)
**ESLint Status:** Not covered

**Why:** Detecting `.find()` calls inside loops requires understanding the iteration context.

**Alternative:** Code review.

---

### ❌ 7.3 Cache Property Access in Loops (`js-cache-property-access`)
**ESLint Status:** Not covered

**Why:** Detecting repeated property access in hot paths requires understanding loop bodies.

**Alternative:** Manual optimization.

---

### ❌ 7.4 Cache Repeated Function Calls (`js-cache-function-results`)
**ESLint Status:** Not covered

**Why:** Determining which functions should be memoized requires semantic understanding.

**Alternative:** Profiling, manual optimization.

---

### ❌ 7.5 Cache Storage API Calls (`js-cache-storage`)
**ESLint Status:** Not covered

**Why:** Detecting repeated `localStorage`/`sessionStorage` calls requires data flow analysis.

**Alternative:** Manual review.

---

### ❌ 7.6 Combine Multiple Array Iterations (`js-combine-iterations`)
**ESLint Status:** Not covered

**Why:** Detecting multiple `.filter()` or `.map()` calls on the same array requires understanding data flow.

**Alternative:** Manual optimization.

---

### ❌ 7.7 Early Length Check for Array Comparisons (`js-length-check-first`)
**ESLint Status:** Not covered

**Why:** Detecting array comparisons that could benefit from length check requires semantic analysis.

**Alternative:** Manual review.

---

### ❌ 7.8 Early Return from Functions (`js-early-exit`)
**ESLint Status:** Not covered

**Why:** Determining optimal early return points requires understanding function semantics.

**Alternative:** Manual optimization.

---

### ⚠️ 7.9 Hoist RegExp Creation (`js-hoist-regexp`)
**ESLint Status:** Partially covered

**ESLint Rule:** `no-restricted-syntax` (custom selector)

**Configuration:**
```javascript
'no-restricted-syntax': ['warn', {
  selector: 'JSXElement NewExpression[callee.name="RegExp"]',
  message: 'Move RegExp creation outside of JSX...'
}]
```

**Why Partial:** Only catches `new RegExp()` in JSX, not regex literals or RegExp in function bodies that happen to be components.

---

### ❌ 7.10 Use Loop for Min/Max Instead of Sort (`js-min-max-loop`)
**ESLint Status:** Not covered

**Why:** Detecting when sorting is used just to find min/max requires understanding the usage context.

**Alternative:** Manual review.

---

### ⚠️ 7.11 Use Set/Map for O(1) Lookups (`js-set-map-lookups`)
**ESLint Status:** Not covered

**Why:** Detecting repeated `.includes()` calls that should use Set requires understanding iteration patterns.

**Alternative:** Manual optimization.

---

### ⚠️ 7.12 Use toSorted() Instead of sort() for Immutability (`js-tosorted-immutable`)
**ESLint Status:** Partially covered

**ESLint Rule:** `no-restricted-syntax` (custom selector)

**Configuration:**
```javascript
'no-restricted-syntax': ['warn', {
  selector: 'CallExpression[callee.property.name="sort"]',
  message: 'Array.sort() mutates the original array...'
}]
```

**Why Partial:** Warns on ALL `.sort()` calls, including legitimate cases where mutation is intended. May have false positives.

---

## Section 8: Advanced Patterns (LOW)

### ❌ 8.1 Store Event Handlers in Refs (`advanced-event-handler-refs`)
**ESLint Status:** Not covered

**Why:** Detecting when to use refs for event handlers requires understanding effect dependencies.

**Alternative:** Manual optimization.

---

### ❌ 8.2 useLatest for Stable Callback Refs (`advanced-use-latest`)
**ESLint Status:** Not covered

**Why:** Detecting callback stability issues requires understanding component re-render patterns.

**Alternative:** Manual implementation.

---

## Recommendations

### For Maximum Coverage

1. **Use the provided ESLint config** - Catches barrel imports, some conditional rendering issues, and array mutation patterns.

2. **Enable React Compiler** - Automatically optimizes many patterns:
   - Hoisting static JSX
   - Memoization
   - Re-render optimization

3. **Use bundle analyzers** - For bundle size optimization:
   - `@next/bundle-analyzer`
   - `webpack-bundle-analyzer`

4. **Use React DevTools Profiler** - For performance optimization:
   - Identifies expensive renders
   - Shows component re-render frequency
   - Highlights wasted renders

5. **TypeScript strict mode** - Catches many issues:
   - Prop type mismatches
   - Unused variables
   - Type safety

### Custom Tooling Ideas

For teams wanting more coverage, consider custom tooling:

1. **AST-based custom rules** - Can catch:
   - Sequential awaits in same block
   - `useState` with function calls (not lazy init)
   - Multiple `.filter()` on same variable

2. **TypeScript compiler plugin** - Can analyze:
   - Data flow between async operations
   - Props usage in client components

3. **Runtime profiling** - Can detect:
   - Actual waterfall patterns
   - Expensive renders
   - Unnecessary re-renders
