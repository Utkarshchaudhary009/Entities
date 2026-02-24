# Development Workflow

## Runtime and Package Manager
- Runtime: Bun + Next.js App Router
- Package manager: Bun only (`bun` / `bunx --bun`)
- Do not use `npm` or `pnpm` in this repository.

## Key Commands
- `bun test` runs unit test groups defined in `package.json`
- `bun test tests/integration` runs integration tests
- `bun logs:deployment` inspects latest Vercel deployment logs
- Database utilities:
  - `bun db:generate`
  - `bun db:push`
  - `bun db:migrate`
  - `bun db:seed`

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
