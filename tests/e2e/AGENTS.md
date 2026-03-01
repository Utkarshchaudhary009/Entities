# E2E Testing with Playwright + Clerk

## Overview

E2E tests use **Playwright** with **Clerk Testing Tokens** to bypass OAuth authentication.
Clerk's `@clerk/testing` package provides helpers that authenticate users via the Backend API,
eliminating the need to automate OAuth flows.

## Authentication Strategy

- **Testing Tokens**: Bypass Clerk's bot detection during E2E tests
- **`clerk.signIn()`**: Signs in users via Backend API using email address lookup
- **No OAuth automation required**: The `emailAddress` parameter uses Clerk's secret key to find and authenticate the user

## Environment Variables Required

```bash
# Clerk keys (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Test user email (must exist in Clerk dev instance)
E2E_TEST_USER_EMAIL=test@example.com
```

## Test Commands

```bash
# Run E2E tests
bun test:e2e

# Run specific profile tests
bunx playwright test tests/e2e/profile.spec.ts
```

## Writing Tests

```typescript
import { clerk } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

test('authenticated test', async ({ page }) => {
  await page.goto('/')
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_TEST_USER_EMAIL,
  })
  // User is now authenticated
  await page.goto('/profile')
  // ... assertions
})
```

## Key Files

- `playwright.config.ts` - Playwright configuration
- `global.setup.ts` - Clerk setup and auth state preparation
- `profile.spec.ts` - Profile page E2E tests

## Pass/Fail Criteria

Tests must output:
- `PASS: [test-name] - [reason]`
- `FAIL: [test-name] - [reason]`
