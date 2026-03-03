# Development Workflow

## Runtime and Package Manager
- Runtime: Bun + Next.js App Router
- Package manager: Bun only (`bun` / `bunx --bun`)
- Do not use `npm` or `pnpm` in this repository.

## Key Commands
- `bun test` runs unit test groups defined in `package.json`
- `bun test:integration` runs integration tests
- `bun test:e2e` runs E2E tests with Playwright
- `bun test:e2e:ui` opens Playwright Test UI
- `bun logs:deployment` inspects latest Vercel deployment logs
- Database utilities:
  - `bun db:deploy` — apply pending migrations (used in CI/production)
  - `bun db:generate` — generate Prisma client
  - `bun db:push` — push schema changes without migration
  - `bun db:migrate` — create and apply migrations
  - `bun db:seed` — clean seed data then seed fresh test data
  - `bun db:clean` — remove all seed/test data only (no seeding)

## Test Configuration
Test timeouts are configured in `bunfig.toml`:
```toml
[test]
defaultTimeout = 15000
timeout = 15000
```
This provides a 15-second global timeout, primarily for heavy Prisma integration tests.

## UI Component Testing

Component tests verify UI behavior in isolation using Testing Library.

- Test files reside in `tests/ui/`.
- Each test must import the setup:
  ```typescript
  import "./dom-setup";
  import "./setup";
  ```
  `dom-setup.ts` initializes the happy-dom environment; `setup.ts` extends `expect` with `@testing-library/jest-dom` matchers and configures automatic cleanup.
- Use `@testing-library/react`'s `render` and `screen` for rendering and queries.
- Prefer `@testing-library/user-event` for realistic user interactions.
- Follow the AAA pattern (Arrange-Act-Assert) with clear separation.
- Example: `tests/ui/button.test.tsx` demonstrates Button component tests covering rendering, click handling, and disabled state.

## E2E Testing

E2E tests use **Playwright** with **Clerk Testing Tokens** to verify full application flows in a real browser. Tests are written in `tests/e2e/*.spec.ts` and run via `bunx playwright test`.

### Setup

1. Install Playwright browsers and dependencies:
   ```bash
   bunx playwright install --with-deps chromium
   ```

2. Set environment variables for local testing:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   E2E_TEST_USER_EMAIL=test@example.com
   BASE_URL=http://localhost:3000
   ```

   For CI, these are configured via GitHub secrets (see `.github/workflows/e2e.yml`).

### Writing Tests

Tests use `@playwright/test` with `@clerk/testing/playwright` for authentication.

Example pattern (see `tests/e2e/profile.spec.ts`):
```typescript
import { test, expect } from "@playwright/test";

test("navigates to profile page", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile/);
});
```

Authentication is handled automatically via `global.setup.ts` using Clerk testing tokens, which bypass OAuth flows and bot detection.

**Test result output must follow this format:**
```
PASS: [test-name] - [reason]
```
or
```
FAIL: [test-name] - [reason]
```

### Running Tests

```bash
bun test:e2e              # Run E2E tests
bun test:e2e:ui           # Open Playwright Test UI
bunx playwright test tests/e2e/profile.spec.ts  # Run specific test file
```

### CI Workflow

The GitHub Actions workflow (`.github/workflows/e2e.yml`) automates E2E testing:

- Starts PostgreSQL service
- Runs `bun db:generate` and `bun db:push`
- Seeds test data (optional)
- Starts Inngest dev server
- Starts Next.js dev server and waits for readiness
- Runs Playwright tests
- Uploads screenshots (`tests/e2e/screenshots/`) and HTML report (`tests/e2e/results/`) as artifacts

### Configuration

- Playwright config: `playwright.config.ts`
- Global setup: `tests/e2e/global.setup.ts` (handles Clerk auth state)
- E2E guidelines for Kilo Code: `tests/e2e/AGENTS.md`

## Architecture Rule
- Keep strict flow: `DB -> Service -> API -> Store -> UI`.
- UI components should not call API endpoints directly; use store actions.

## Auth Guidance
- Prefer session claims from Clerk auth token for common role/email access.
- Use `currentUser()` only when full profile data is required.

## API and Validation Standards
- Validate input and query params with Zod.
- Keep response contracts consistent using helpers in `src/lib/api/response.ts`.
- Avoid leaking sensitive values in errors; preserve debugging value with safe, meaningful messages.

## UI/UX Standards
- Use store-driven optimistic updates for CRUD operations.
- Expose granular loading states and bind targeted skeletons/spinners.
- Keep micro-interactions immediate (`active:scale-95`, scoped loading feedback).
- Use `tw-animate-css` for skeleton and reveal animations.
- Use `@hugeicons/core-free-icons` and `@hugeicons/react` for icons (not `lucide-react`).

## Contribution Checklist
1. Follow file conventions (`page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, etc.).
2. Prefer SOLID and avoid duplicate logic.
3. Keep logger/console messages static and useful.
4. Update `.env.example` for any new env keys (safe placeholders only).
5. Ensure changed files pass:
   - `bun --bun biome check <filepath>`
   - `bun --bun tsc <filepath>`

## Documentation Index
- Architecture: `docs/architecture.md`
- Review report: `docs/review-report.md`
