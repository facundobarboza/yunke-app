---
name: tsx-verify
description: >
  TypeScript verification workflow for React Native/Expo projects.
  Run tsc, parse errors, filter known issues, and report clean pass/fail.
  Trigger: After code changes, before commits, or when user asks to verify/validate TypeScript.
---

# TypeScript Verification

Standardized workflow for running TypeScript type checks in React Native/Expo projects.

## When to Use

- After implementing code changes
- Before creating commits
- When user asks to "verify", "check types", "validate", or "run tsc"
- As a verification step in any code modification task

## Workflow

### 1. Run Type Check

```bash
npx tsc --noEmit 2>&1
```

For filtered output (hide known external issues):
```bash
npx tsc --noEmit 2>&1 | grep -v "ExternalLink.tsx"
```

For readable output:
```bash
npx tsc --noEmit --pretty 2>&1
```

### 2. Parse Results

- **Exit code 0**: Clean — no type errors
- **Exit code non-zero**: Errors exist — parse output

### 3. Report Format

```
## TypeScript Verification

**Status**: ✅ PASS | ❌ FAIL

**Errors**: [count]
1. `file.tsx:line:col` — Error description
2. ...

**Known safe ignores**:
- ExternalLink.tsx href casting (expected)
```

### 4. Common Patterns

| Error | Fix |
|-------|-----|
| `TS2322: string not assignable to href` | Cast with `as any` for external links |
| `TS2304: Cannot find name 'X'` | Remove unused variable/import |
| `TS18004: No value exists in scope for shorthand property` | Remove shorthand from object literal |
| `TS2551: Property 'X' does not exist` | Check Supabase types or add to type definition |

### 5. Timeout Guidelines

- Small project (<100 files): 30s timeout
- Medium project (100-500 files): 60s timeout
- Large project (500+ files): 120s timeout

## Notes

- Always use `--noEmit` to avoid generating output files
- Pipe through `grep -v` to filter known false positives
- Use `--pretty` for human-readable output in interactive sessions
- Check exit code, not just output text, to determine pass/fail
