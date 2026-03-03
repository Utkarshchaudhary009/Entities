# Entities

Entities is a Next.js App Router backend/frontend project for commerce and brand management domains (products, variants, cart, orders, discounts, brand content, and user profiles), built with Bun, Prisma, Clerk, Inngest, and Zustand.

## Core Architecture

Required flow:

`DB -> Service -> API -> Store -> UI`

- `prisma/schema.prisma` defines domain models and persistence.
- `src/services/*` owns business logic and Prisma access.
- `src/app/api/*` exposes route handlers with validation + auth guards.
- `src/stores/*` manages API orchestration, optimistic updates, loading/error state.
- `src/components` and `src/app` render UI from store state.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Bun
- Prisma + PostgreSQL
- Clerk auth
- Supabase Storage (file uploads)
- Inngest events/functions
- Zustand state management
- PostHog Analytics
- Biome lint/format

## Commands

Use Bun only.

```bash
# Testing
bun test                      # Run unit tests
bun test:integration          # Run integration tests
bun test:e2e                  # Run E2E tests with Playwright
bun test:e2e:ui               # Open Playwright Test UI

# Operations
bun logs:deployment
bun db:generate
bun db:push
bun db:migrate
bun db:seed
bun db:clean
```

## E2E Testing

The project uses **Playwright** for end-to-end testing with **Clerk Testing Tokens** to bypass OAuth authentication.

### Environment Variables

For local E2E testing, set these optional variables in `.env`:

```bash
E2E_TEST_USER_EMAIL=test@example.com   # Test user for authenticated flows
BASE_URL=http://localhost:3000         # Base URL for tests
```

Clerk credentials (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) are required for tests that need authentication.

### Configuration

- Playwright config: `playwright.config.ts`
- Global setup: `tests/e2e/global.setup.ts` (handles Clerk auth state)
- E2E guidelines for Kilo Code: `tests/e2e/AGENTS.md`

### Running Tests

```bash
bun test:e2e              # Run E2E tests
bun test:e2e:ui           # Open Playwright Test UI
bunx playwright test tests/e2e/profile.spec.ts  # Run specific test file
```

## Development Rules

- Do not use `npm`/`pnpm`.
- Follow Next.js App Router file conventions (`page.tsx`, `layout.tsx`, `route.ts`, etc.).
- Use `proxy.ts` (not `middleware.ts`).
- Prefer Clerk session claims for role/email data; use `currentUser()` only when full profile data is required.
- Keep API responses consistent using helpers in `src/lib/api/response.ts`.
- Keep console/logger messages static and meaningful.
- Do not leak sensitive data in logs or errors.

## Testing and Quality

Per changed file:

```bash
bun --bun biome check <filepath>
bun --bun tsc <filepath>
```

Project test suites:

- `tests/unit/*` — unit tests with `bun:test`
- `tests/integration/*` — real DB interaction tests
- `tests/ui/*` — component tests with Testing Library
- `tests/e2e/*` — end-to-end tests using Playwright

See [`tests/e2e/AGENTS.md`](tests/e2e/AGENTS.md) for E2E setup and usage.

## Documentation

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Development workflow: [`docs/development-workflow.md`](docs/development-workflow.md)
- Repository review report: [`docs/review-report.md`](docs/review-report.md)
- Additional guides: [`guide/`](guide)
