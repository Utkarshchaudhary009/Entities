# Repository Guidelines

## Communication
- Suggest 5 unique, researched paths per task.
- Create `MASTER-PLAN.md` before edit tasks; delete after completion.
- Log unusual discoveries in **Learnings** below.

## Learnings
- User values clear architectural explanations — professional tone, descriptive "what and why."


## Commands (Bun only — never npm/pnpm)
- `bun logs:deployment` — inspect latest Vercel deploy (streams logs on failure, summary on success).
- **Never run locally** (PC too weak): `bun dev|build|start|lint|format|format:check|type-check`.

## Coding Practices
- Add meaning error log full help in debugging. Copywritted error for user
- consistent API responses
- use @hugeicons/core-free-icons and @hugeicons/react instead of lucide-react.
- It must and strictly USE SOLID principles, No duplicate logic
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
 **Full User**: Use `currentUser()` only when full profile needed (extra DB call). Prefer adding required fields to session claims/token via Clerk Dashboard → Sessions → Customize session token
Session Token Customization (Clerk Dashboard → Sessions)
Add custom claims instead of calling currentUser():
{
  "email": "{{user.primary_email_address}}",
  "role": "{{user.public_metadata.role}}"
}
Then access in code: const { sessionClaims } = await auth()
const userRole = sessionClaims?.role

## Core UX & Performance (Store-to-UI Layer)
- **Architecture Flow**: `DB -> Service -> API -> Store -> UI`. The UI **never** talks to the API directly.
- **Store-Driven Optimistic UI**: Zustand store immediately updates the UI with a temporary state before calling the API (or triggering Inngest). Revert silently on failure, notifying via a toast.
- **Granular Loading States**: UI avoids global loaders; binds precisely to store-managed granular states (e.g., `isAddingBrand`, `deletingId`) to trigger `tw-animate-css` skeletons/spinners.
- **Store-Mediated Prefetching**: UI components trigger store prefetch actions on hover/focus to hydrate cache before user click.
- **Micro-interactions**: Every UI action requires instant visual feedback (< 100ms) like `active:scale-95`, strictly synced to the store's synchronous actions.
- **Skeletons & Reveals:** Use `tw-animate-css` (`animate-pulse`, `animate-fade-in-up`) for exactly-sized `<Skeleton>` layouts during loading.
- **Intent Prefetching:** Prefetch heavily on Hover/Focus (e.g., hovering a data table row prefetches the detail page).
- **Streaming:** Use React `<Suspense>` to unblock critical UI.

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
- [ ]  Coding Practices are strictly followed.
- [ ] `.env.example` up to date for new keys
- [ ] All logger/console calls use static strings
- [ ] No sensitive data in error messages or server logs but meaning that can help with debugging.  
- [ ] UI tested — no data leakage
- [ ] UX Verified — Store-driven optimistic updates used, UI isolated from API, instant micro-interactions present.
