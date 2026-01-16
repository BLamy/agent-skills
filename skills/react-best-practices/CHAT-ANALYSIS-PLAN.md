# Chat History Analysis → ESLint Rule Generation

## Overview

A system that analyzes API chat logs to identify common code mistakes and automatically generates ESLint rules to catch those issues statically—without LLM calls at runtime.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CHAT ANALYSIS PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  API Logs    │───▶│   Parser     │───▶│   Differ     │              │
│  │  (JSON)      │    │              │    │              │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                 │                       │
│                                                 ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  Rule        │◀───│  Pattern     │◀───│  Issue       │              │
│  │  Generator   │    │  Extractor   │    │  Classifier  │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┐    ┌──────────────┐                                  │
│  │  ESLint      │───▶│  Test        │                                  │
│  │  Rules       │    │  Generator   │                                  │
│  └──────────────┘    └──────────────┘                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Chat History Parser

### Input Format (Anthropic API Logs)

```json
{
  "messages": [
    {"role": "user", "content": "Fix this code..."},
    {"role": "assistant", "content": [
      {"type": "tool_use", "name": "Edit", "input": {...}},
      {"type": "text", "text": "I fixed the issue..."}
    ]}
  ]
}
```

### Extraction Targets

1. **Code Blocks** - Extract from `text` content using regex/markdown parsing
2. **Tool Calls** - Parse `Edit`, `Write`, `Bash` tool invocations
3. **File Context** - Track which files were read/modified
4. **Temporal Sequence** - Order operations to identify corrections

### Parser Output Schema

```typescript
interface ParsedConversation {
  id: string;
  files: Map<string, FileHistory>;
  codeChanges: CodeChange[];
  errors: DetectedError[];
}

interface CodeChange {
  file: string;
  timestamp: number;
  type: 'create' | 'edit' | 'delete';
  before: string | null;
  after: string;
  context: string; // surrounding conversation
}

interface DetectedError {
  file: string;
  originalCode: string;
  fixedCode: string;
  errorMessage?: string; // from bash output, user message
  category?: string;
}
```

---

## Phase 2: Correction Detection (Differ)

### Heuristics for Identifying Mistakes

1. **Explicit Error Messages**
   - Bash output containing "Error:", "TypeError:", "SyntaxError:"
   - User messages: "this doesn't work", "there's a bug", "fix this"

2. **Sequential Edits to Same Location**
   - Same file edited multiple times in short succession
   - Small diffs that look like corrections (not feature additions)

3. **Revert Patterns**
   - Code changed back to something similar to original
   - Indicates initial change was wrong

4. **Test Failures → Fixes**
   - Test run fails, followed by edit, followed by test pass

### Diff Analysis

```typescript
interface CorrectionPair {
  buggy: CodeSnippet;
  fixed: CodeSnippet;
  confidence: number; // 0-1 how confident this is a correction
  evidence: string[]; // why we think this is a correction
}

function detectCorrections(changes: CodeChange[]): CorrectionPair[] {
  // Group changes by file
  // Look for edit-then-edit patterns
  // Check for error messages between edits
  // Score confidence based on evidence
}
```

---

## Phase 3: Issue Classifier

### Category Taxonomy

```typescript
type IssueCategory =
  | 'security:xss'
  | 'security:injection'
  | 'security:secrets'
  | 'performance:render'
  | 'performance:memory'
  | 'performance:algorithm'
  | 'correctness:null-check'
  | 'correctness:async'
  | 'correctness:type-coercion'
  | 'react:hooks'
  | 'react:state'
  | 'react:effects'
  | 'style:naming'
  | 'style:structure';
```

### Classification Approach

**Option A: Rule-Based (No LLM)**
- AST pattern matching on the diff
- Keyword detection in error messages
- Known anti-pattern signatures

**Option B: One-Time LLM Classification (Offline)**
- Use LLM to classify corrections during analysis phase
- Store classifications for rule generation
- No LLM needed at lint-time

### Prioritization Scoring

```typescript
interface PrioritizedIssue {
  category: IssueCategory;
  frequency: number;      // how often this pattern appears
  severity: 'error' | 'warning' | 'suggestion';
  automatable: boolean;   // can we write an AST-based rule?
  fixable: boolean;       // can we auto-fix?
  examples: CorrectionPair[];
}
```

---

## Phase 4: Pattern Extractor

### AST Pattern Mining

For each correction pair, extract the AST pattern that identifies the bug:

```typescript
interface ASTPattern {
  // What to match (buggy pattern)
  selector: string;  // ESLint selector syntax
  constraints: Constraint[];

  // What to replace with (fix pattern)
  fix?: {
    type: 'replace' | 'insert' | 'remove';
    template: string;
  };
}

// Example: Detect `array.length && <Component />`
const pattern: ASTPattern = {
  selector: 'JSXExpressionContainer > LogicalExpression[operator="&&"]',
  constraints: [
    { path: 'left.property.name', equals: 'length' },
    { path: 'right.type', matches: /JSX/ }
  ],
  fix: {
    type: 'replace',
    template: '{{left}} !== 0 ? {{right}} : null'
  }
};
```

### Pattern Generalization

1. **Variable Name Abstraction** - Replace specific names with wildcards
2. **Structure Preservation** - Keep AST shape, remove literals
3. **Context Requirements** - Note if pattern only applies in certain contexts (hooks, JSX, etc.)

### Pattern Validation

```typescript
function validatePattern(pattern: ASTPattern, examples: CorrectionPair[]): {
  precision: number;  // % of matches that are true bugs
  recall: number;     // % of bugs that pattern catches
  falsePositives: CodeSnippet[];
} {
  // Run pattern against known buggy code (should match)
  // Run pattern against known good code (should not match)
  // Run pattern against fixed code (should not match)
}
```

---

## Phase 5: ESLint Rule Generator

### Rule Template

```javascript
// Generated rule template
export default {
  meta: {
    type: '{{type}}',
    docs: {
      description: '{{description}}',
      category: '{{category}}',
      recommended: {{recommended}},
    },
    fixable: '{{fixable}}',
    schema: [],
    messages: {
      {{messageId}}: '{{message}}',
    },
  },
  create(context) {
    return {
      '{{selector}}'(node) {
        {{#constraints}}
        if ({{condition}}) return;
        {{/constraints}}

        context.report({
          node,
          messageId: '{{messageId}}',
          {{#if fixable}}
          fix(fixer) {
            return fixer.replaceText(node, `{{fixTemplate}}`);
          },
          {{/if}}
        });
      },
    };
  },
};
```

### Generation Process

```typescript
function generateRule(pattern: ASTPattern, issue: PrioritizedIssue): string {
  const template = loadTemplate('eslint-rule.js.mustache');

  return render(template, {
    type: issue.severity === 'error' ? 'problem' : 'suggestion',
    description: generateDescription(issue),
    category: issue.category,
    recommended: issue.frequency > THRESHOLD,
    fixable: pattern.fix ? 'code' : null,
    selector: pattern.selector,
    constraints: pattern.constraints.map(toCondition),
    messageId: toMessageId(issue.category),
    message: generateMessage(issue),
    fixTemplate: pattern.fix?.template,
  });
}
```

---

## Phase 6: Test Generator

### Auto-Generate Test Cases from Examples

```typescript
function generateTests(pattern: ASTPattern, examples: CorrectionPair[]): string {
  const validCases = examples.map(e => e.fixed);
  const invalidCases = examples.map(e => ({
    code: e.buggy,
    output: e.fixed,  // for fixable rules
    errors: [{ messageId: pattern.messageId }],
  }));

  return `
import { ruleTester } from './rule-tester.js';
import rule from '../rules/${pattern.ruleId}.js';

describe('${pattern.ruleId}', () => {
  it('should pass RuleTester validation', () => {
    ruleTester.run('${pattern.ruleId}', rule, {
      valid: ${JSON.stringify(validCases, null, 2)},
      invalid: ${JSON.stringify(invalidCases, null, 2)},
    });
  });
});
`;
}
```

---

## Implementation Plan

### Directory Structure

```
skills/
  chat-analyzer/
    SKILL.md
    scripts/
      analyze.sh          # Entry point
    src/
      parser/
        api-log-parser.ts # Parse Anthropic/OpenAI logs
        code-extractor.ts # Extract code from messages
      differ/
        correction-detector.ts
        diff-analyzer.ts
      classifier/
        issue-classifier.ts
        pattern-matcher.ts
      generator/
        rule-generator.ts
        test-generator.ts
        template.mustache
      cli.ts              # Main CLI
    output/
      patterns.json       # Extracted patterns
      rules/              # Generated ESLint rules
      tests/              # Generated tests
```

### Step-by-Step Implementation

| Step | Component | Description | Dependencies |
|------|-----------|-------------|--------------|
| 1 | API Log Parser | Parse JSON logs, extract messages | None |
| 2 | Code Extractor | Extract code blocks, tool calls | Parser |
| 3 | File Timeline | Build per-file edit history | Extractor |
| 4 | Correction Detector | Identify bug→fix pairs | Timeline |
| 5 | Issue Classifier | Categorize issues | Detector |
| 6 | Pattern Extractor | Mine AST patterns | Classifier |
| 7 | Pattern Validator | Check precision/recall | Extractor |
| 8 | Rule Generator | Output ESLint rules | Validator |
| 9 | Test Generator | Output test files | Generator |
| 10 | CLI Integration | Unified command interface | All |

---

## Usage

### Analyze Chat Histories

```bash
# Analyze a folder of API logs
npx chat-analyzer analyze ./logs --output ./analysis

# Generate rules from analysis
npx chat-analyzer generate ./analysis --min-frequency 3 --min-confidence 0.8

# Validate generated rules
npx chat-analyzer validate ./output/rules --test-corpus ./known-bugs
```

### Output

```
Analysis complete:
  - 1,247 conversations parsed
  - 342 correction pairs detected
  - 28 unique patterns identified

Generated rules:
  ✓ no-falsy-length-and (frequency: 47, confidence: 0.95)
  ✓ prefer-optional-chain (frequency: 31, confidence: 0.92)
  ✓ no-async-in-useeffect (frequency: 28, confidence: 0.88)
  ...
```

---

## Considerations

### False Positive Management

- Require minimum frequency threshold (e.g., pattern seen 3+ times)
- Require minimum confidence score (e.g., 0.8+)
- Human review step before adding to recommended config
- Start with `warn` severity, upgrade to `error` after validation

### Pattern Limitations

Not all corrections can become lint rules:
- **Context-dependent bugs** - Require understanding business logic
- **Cross-file issues** - ESLint rules are single-file
- **Runtime behavior** - Static analysis can't catch everything

### Privacy/Security

- Sanitize any secrets/credentials in logs before analysis
- Don't store raw conversation content in generated rules
- Aggregate patterns, don't expose individual conversations

---

## Success Metrics

1. **Coverage** - % of historical bugs that would be caught by generated rules
2. **Precision** - % of rule violations that are true bugs (not false positives)
3. **Fix Rate** - % of issues that have working auto-fixes
4. **Adoption** - # of generated rules added to recommended config
