# Repository Guidelines

## Communication
- Suggest 5 unique, researched paths per task.
- Create `MASTER-PLAN.md` before edit tasks; delete after completion.
- Log unusual discoveries in **Learnings** below.

## Learnings
- User values clear architectural explanations — professional tone, descriptive "what and why."

## Before You Start
- Don't read `README.md` by default — state why it's needed first, then use a subagent to summarize relevant parts.
- Invoke skills once the task domain is clear.
- Use subagents (with precise, scoped instructions) for docs, research, internet, or non-coding work.
- Docs: Bun → `refrence/bun`, Vercel SDK → `D:\code\Docs\vercelsdk`, Jules API → `D:\code\Docs\jules`.

## Project Structure
- **CLI tools**: Vercel CLI & GitHub CLI globally installed and logged in.
- **App Router**: `src/app/` (route groups `(auth)`, `(jules)`, `api/`); `page.tsx`/`layout.tsx` per segment.
- **Shared code**: UI → `src/components/`, utils → `src/lib/`, state → `src/stores/`, types → `src/types/`.
- **Other**: styles → `src/app/globals.css`, assets → `public/`, DB → `prisma/schema.prisma`, docs →  `D:\code\Docs\`.

## Commands (Bun only — never npm/pnpm)
- `bun logs:deployment` — inspect latest Vercel deploy (streams logs on failure, summary on success).
- **Never run locally** (PC too weak): `bun dev|build|start|lint|format|format:check|type-check`.

## Coding Style
- Follow Next.js App Router conventions; use `proxy.ts` instead of deprecated `middleware.ts`.
- **File Conventions (MUST USE where possible)**:
  - `page.tsx`: Route UI
  - `layout.tsx`: Shared wrapper
  - `loading.tsx`: Suspense fallback
  - `error.tsx`: Error boundary (must be client component)
  - `not-found.tsx`: 404 UI
  - `route.ts`: API endpoint
  - `template.tsx`: Remounts on navigation
  - `default.tsx`: Parallel route fallback
- **Routing Patterns**:
  - **Dynamic**: `[slug]`
  - **Catch-all**: `[...slug]`
  - **Optional**: `[[...slug]]`
  - **Groups**: `(marketing)` (no URL effect)
  - **Private**: `_folder`
  - **Parallel**: `@slot` (layout receives as props)
  - **Intercept**: `(.)` same level, `(..)` up one, `(..)(..)` up two, `(...)` from root
- **shadcn/ui**: install via `bunx --bun shadcn@latest add <name>` — don't write manually. Existing components in `components/ui/`. [Docs](https://ui.shadcn.com/).
- **Tailwind CSS v4**: Use `@import "tw-animate-css";` in `globals.css` (instead of `tailwindcss-animate` plugin).
- **All errors (type & lint) must be fixed** — never skip or ignore.

## Commit & PR Guidelines
- Always branch for new work.
- After passing Compliance Checklist, ask: "Should I create a pull request?" Then commit + open a detailed PR (summary, key changes, test results, UI screenshots).
- **Post-PR**: wait 120s → `bun logs:deployment` → fix failures before requesting review.
- **"check review"** → `bun run pr` → fix errors/suggestions.
- **"rebase"** → rebase to main, squash trivial commits (typos, lint, type fixes, forgotten lib installs). Never squash feature commits.

## Security
- Never commit secrets — use env vars. Update `.env.example` (with safe placeholders) for any new key.

## Compliance Checklist
Before submitting:
- [ ] `.env.example` up to date for new keys
- [ ] All logger/console calls use static strings
- [ ] No sensitive data in error messages or server logs
- [ ] UI tested — no data leakage
- [ ] Per changed file: `bun --bun eslint {filepath}` & `bun --bun tsc {filepath}` (never project-wide)