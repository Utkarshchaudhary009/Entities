# Unit & Integration Testing Best Practices

This guide outlines the principles and standards for writing production-grade tests in this project. It is based on engineering practices from companies like Google, Microsoft, and Amazon, tailored for our stack (Next.js, Bun, TypeScript, Prisma).

## 1. Core Philosophy

*   **Maintainability > Brevity:** Test code is production code. Prioritize readability. It is better to duplicate setup code (DAMP - Descriptive And Meaningful Phrases) than to create complex, shared abstractions that make tests hard to understand.
*   **Test Public Behavior:** Verify *what* the code does (its public API), not *how* it does it (implementation details). Refactoring private methods should not break tests.
*   **One Concept Per Test:** Each test should verify a single behavior or scenario. If a test fails, the name alone should explain the bug.

## 2. Unit Testing Standards (Fast & Isolated)

Unit tests must run in milliseconds and never touch the database or network.

### A. Structural Standards (AAA Pattern)
Every unit test must follow the **Arrange-Act-Assert** pattern, visually separated by newlines.

```typescript
import { describe, it, expect } from "bun:test";

describe("applyDiscount", () => {
  it("should calculate correct price when discount is valid", () => {
    // ARRANGE: Setup isolated data for this specific test
    const price = 100;
    const discount = 20;

    // ACT: Run the unit of work
    const result = applyDiscount(price, discount);

    // ASSERT: Verify the outcome
    expect(result).toBe(80);
  });
});
```

### B. Handling Edge Cases
Do not just test the "Happy Path". Actively hunt for failures:
*   **Boundary Value Analysis:** Test start/end of ranges (`0`, `1`, `100`, `101`).
*   **Type Safety:** `null`, `undefined`, empty strings/arrays.
*   **Property-Based:** Verify invariants (e.g. "sorting never changes list length").

### C. Mocking Strategy
*   **Prefer Fakes over Mocks:** Use lightweight in-memory implementations.
*   **Mock External Boundaries:** Only mock uncontrollable external services (Database, Stripe, Email).
*   **Don't Mock Internals:** Do not mock internal helper functions unless necessary.

## 3. Integration Testing Standards (Real & Robust)

Integration tests verify that real components work together (e.g., Service -> Database).

### A. Philosophy
*   **Real Dependencies:** Use a real (containerized or test) Postgres database. Do not mock Prisma here.
*   **Isolation:** Each test should start with a clean state. Truncate tables before/after tests.
*   **Separation:** Keep these tests separate from unit tests as they are slower.

### B. Best Practices
1.  **Environment Isolation:** Use a separate `.env.test` to protect development data.
2.  **Seed Data:** Create fresh data within the test (Arrange phase). Do not rely on global seed data.
3.  **Test Critical Paths:** Focus on "Happy Paths" and critical constraint violations (e.g., unique key errors).

## 4. Metrics That Matter

*   **Reliability:** Tests must be deterministic. Flaky tests (pass sometimes, fail others) must be deleted or fixed immediately.
*   **Speed:** Unit tests: <10ms. Integration tests: <1s.
*   **Coverage:** Use coverage to find untested paths, not as a vanity metric.

## 5. Implementation Guide (Bun)

We use `bun:test` for running tests.

*   **Run all tests:** `bun test`
*   **Run unit tests only:** `bun test tests/unit`
*   **Run integration tests:** `bun test tests/integration` (Requires DB setup)
*   **Watch mode:** `bun test --watch`

Always ensure your tests pass locally before pushing code.
