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
- Biome lint/format

## Commands

Use Bun only.

```bash
bun test
bun test tests/integration
bun logs:deployment
bun db:generate
bun db:push
bun db:migrate
bun db:seed
bun db:clean
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

- `tests/unit/*`
- `tests/integration/*`

## Documentation

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Development workflow: [`docs/development-workflow.md`](docs/development-workflow.md)
- Repository review report: [`docs/review-report.md`](docs/review-report.md)
- Additional guides: [`guide/`](guide)
