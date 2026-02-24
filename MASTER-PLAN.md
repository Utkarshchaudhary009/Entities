# MASTER PLAN - Fix `src/proxy.ts`

Date: 2026-02-24

## Task
Fix `proxy.ts` conditions, methods, and logic for route protection.

## 5 Researched Paths
1. Minimal bugfix only
- Fix `if (isAdminRoute)` to `if (isAdminRoute(request))` and correct redirect return value.
- Lowest risk, but keeps weak method handling and role parsing.

2. Structured guard flow (recommended)
- Early-return for public routes and preflight requests.
- Protect non-public routes, then apply admin-only authorization only on admin matchers.
- Add explicit `NextResponse` returns for every branch.

3. Shared role parser extraction
- Reuse `getRoleFromSessionClaims` from auth guards by exporting helper and consuming in proxy.
- Best consistency, but touches extra files for a simple proxy fix.

4. Split page/admin API authorization responses
- Redirect to `/` for page routes, JSON 403 for admin API routes.
- Better UX/API semantics, but requires defining and maintaining parallel route matchers.

5. Clerk-only protect callback approach
- Use `auth.protect((has)=>...)` style callbacks for role checks inside Clerk middleware.
- Clean for Clerk-native flows, but less explicit than project's custom role extraction style.

## Selected Path
2. Structured guard flow, with typed role check using existing `Role` constants.

## Acceptance
- Public routes remain accessible.
- Non-public routes require auth.
- Admin routes require `role === "admin"`.
- No invalid Next.js proxy APIs are used.
- Targeted file checks pass.
