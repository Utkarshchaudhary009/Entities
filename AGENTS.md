# Repository Guidelines

## Commands (Bun only)

| Command | Description |
|---------|-------------|
| `bun test` | Run unit tests |
| `bun test:integration` | Run integration tests |
| `bun test:ui` | Run UI tests |
| `bun test:e2e` | Run E2E tests (Kilo + agent-browser) |
| `bun test:e2e:local` | Run E2E tests against localhost:3000 |
| `bun logs:deployment` | Inspect latest Vercel deploy |

**Never run locally** (PC resource constraints): `bun dev|build|start|lint|format|type-check`

## Testing Guidelines

### Unit Tests (`tests/unit/`)
- Use `bun:test` framework
- Follow AAA pattern: Arrange → Act → Assert
- Mock external dependencies only
- One concept per test

### Integration Tests (`tests/integration/`)
- Test real DB interactions
- Isolate with clean state per test
- Focus on critical paths

### E2E Tests (`tests/e2e/`)
- Use `agent-browser` CLI via Kilo Code
- Always output `PASS:` or `FAIL:` with reason
- Capture screenshots on completion
- See `tests/e2e/AGENTS.md` for detailed workflow

## E2E Test Result Format

**Required output format:**
```
PASS: [test-name] - [success reason]
```
or
```
FAIL: [test-name] - [specific failure reason]
```

### Pass Criteria
- Expected elements visible
- Expected text appears
- URL matches expected pattern
- No JavaScript console errors
- Screenshot shows correct state

### Fail Criteria
- Element not found/visible after timeout
- Text assertion mismatch
- URL doesn't match expected
- JavaScript errors present
- Timeout exceeded (25s default)

## Compliance Checklist

Before submitting:
- [ ] All tests pass: `bun test`
- [ ] E2E tests pass: `bun test:e2e`
- [ ] No type errors: `bun --bun tsc --noEmit`
- [ ] No lint errors: `bun --bun biome check`
