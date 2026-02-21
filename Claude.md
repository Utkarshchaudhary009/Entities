# Code Review Bug-Catching Checklist

After review is completed, write an `audit.md` file containing a well-formatted, compact, and exact description of the problem and its fix.

- [ ] Verify contracts: inputs/outputs, nullability, error semantics, and invariants changed by the diff.
- [ ] Codebase must follow best practices of vercel and react. review one by one by invoking the skills.
- [ ] Trace data flow end-to-end across modules; every new path is validated or guarded.
- [ ] Find all call sites of changed APIs (including tests/scripts) and confirm each is updated.
- [ ] Check cross-layer assumption mismatches: types, units, time zones, encodings, and ID formats.
- [ ] Inspect async/concurrency behavior: ordering, races, idempotency, retries, and timeouts.
- [ ] Review resource lifecycles: allocate/init, reuse, cleanup, cancellation, and disposal.
- [ ] Look for silent failures: swallowed errors, ignored promises, or logging without handling.
- [ ] Validate edge cases: empty, huge, malformed, and boundary inputs; off-by-one and overflow risks.
- [ ] Confirm compatibility/migrations: schema changes, rollbacks, feature flags, and versioned APIs.
- [ ] Check security/privacy: authN/authZ, data exposure, and sensitive data in logs/errors.
- [ ] Verify config/flags/defaults: safe fallbacks and correct behavior per environment.
- [ ] Ensure tests target new logic with meaningful assertions and at least one negative case.
- [ ] Scrutinize tests for false confidence: over-mocking, missing awaits, or nondeterminism.
- [ ] Assess performance impact on hot paths: N+1 queries, extra round-trips, heavy allocations.
- [ ] Compare with established patterns; any deviation is justified and documented in the PR.

---

# Next.js / React Best Practices

## App Router (app/)

### File Conventions

- `page.tsx` = route UI, `layout.tsx` = shared wrapper, `loading.tsx` = Suspense fallback, `error.tsx` = error boundary (must be client), `not-found.tsx` = 404, `route.ts` = API endpoint, `template.tsx` = remounts on nav, `default.tsx` = parallel route fallback
- Dynamic: `[slug]`, Catch-all: `[...slug]`, Optional: `[[...slug]]`, Group: `(marketing)` (no URL), Private: `_folder`
- Parallel: `@slot` (layout receives as props), Intercept: `(.)` same level, `(..)` up one, `(..)(..)` up two, `(...)` from root
- The "middleware.ts" file convention is deprecated. Please use "proxy.ts"

### RSC Boundaries (Server/Client)

- **P0**: Client components (`'use client'`) **cannot** be async - fetch in parent server component
- **P0**: Props Server→Client must be serializable: no functions (except Server Actions), no Date/Map/Set/class instances/Symbol/circular refs
- Serialize dates: `date.toISOString()` → reconstruct in client; Convert Map/Set: `Object.fromEntries(map)` / `Array.from(set)`
- Server Actions with `'use server'` CAN be passed to client components

### Async Patterns (Next.js 15+)

- **P0**: `params`, `searchParams`, `cookies()`, `headers()` are async - must await
- Type: `params: Promise<{ slug: string }>`, `searchParams: Promise<{ query?: string }>`
- In sync components: `const { slug } = use(params)` (React.use)
- `generateMetadata({ params })`: await params like pages

### Data Patterns

**Decision Tree:**

- Server Component reads: fetch directly (no API)
- Client Component mutations: Server Actions (POST only, no caching)
- Client Component reads: pass from Server Component OR Route Handler (cacheable GET)
- External APIs/webhooks: Route Handler

**P0 - Avoid Waterfalls:**

- Sequential: Bad → Use `Promise.all([getUser(), getPosts()])`
- Streaming: Wrap async components in `<Suspense fallback={<Skeleton />}>`
- Preload: `export const preloadUser = (id) => { void getUser(id) }` then call early in page

**React Cache:**

```ts
import { cache } from 'react'
export const getUser = cache(async (id) =>
  db.user.findUnique({ where: { id } })
)
```

### Error Handling

- `error.tsx`: Client component with `{ error, reset }` props, bubbles up to nearest boundary
- `global-error.tsx`: Must include `<html><body>`, catches root layout errors
- `not-found()`: Triggers nearest `not-found.tsx`, `forbidden()`: 403, `unauthorized()`: 401
- **P0**: Never wrap `redirect()`, `permanentRedirect()`, `notFound()`, `forbidden()`, `unauthorized()` in try-catch (they throw internal errors)
- Use `unstable_rethrow(error)` in catch blocks to re-throw Next.js navigation errors

### Suspense Boundaries (CSR Bailout)

- **P0**: `useSearchParams()` always requires Suspense (causes full CSR without it)
- **P0**: `usePathname()` requires Suspense in dynamic routes
- `useParams()`, `useRouter()` do NOT require Suspense

### Route Handlers (route.ts)

- Cannot coexist with `page.tsx` in same folder
- Methods: GET (cacheable), POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- No React hooks/DOM APIs - pure server environment
- Dynamic: `export async function GET(request, { params }: { params: Promise<{ id }> })`
- Response: `Response.json(data)`, `Response.json({error}, {status: 404})`, `Response.redirect(url)`

### Metadata & OG Images

- **P0**: Metadata only in Server Components (not `'use client'`)
- Static: `export const metadata: Metadata = { title, description }`
- Dynamic: `export async function generateMetadata({ params }): Promise<Metadata>`
- Use `cache()` to avoid duplicate fetches for metadata + page data
- Viewport: separate export `export const viewport: Viewport` (streaming support)
- Title template: `title: { default: 'Site', template: '%s | Site' }` in root layout
- **OG Images:** Use `next/og` not `@vercel/og`, no Edge runtime, no searchParams
- File: `opengraph-image.tsx` (OG), `twitter-image.tsx` (Twitter, optional, falls back to OG)
- Size: `{ width: 1200, height: 630 }`, styles: inline objects, flexbox only (no grid)
- File-based metadata: `favicon.ico`, `icon.png`, `opengraph-image.png`, `sitemap.ts`, `robots.ts`

### Directives

- `'use client'` - marks Client Component (hooks, browser APIs)
- `'use server'` - marks Server Action (can be called from client)
- `'use cache'` - Next.js caching directive (experimental)

## React Best Practices

### Performance

**P0:**

- Eliminate waterfalls: `Promise.all()` for independent async
- Dynamic imports: `next/dynamic` for heavy components
- Avoid barrel files: import directly from module files
- No unserializable props to Client Components

**P1:**

- `React.cache()` for request deduplication
- `after()` for non-blocking cleanup/logging
- SWR/React Query for client data caching
- Minimal data serialization to Client Components

**P2 - Re-renders:**

- `useMemo` for expensive calculations
- Primitive values in dependency arrays
- `setState(prev => ...)` for stable callbacks
- `startTransition()` for non-urgent updates
- Ternary `? :` not `&&` for conditional rendering
- Hoist static JSX outside components

**P3 - JS Perf:**

- Maps for O(1) lookups, batch DOM changes via classes
- `toSorted()`, `toReversed()` for immutability

### Hooks

- `useRouter()`, `usePathname()`, `useSearchParams()`, `useParams()` from `next/navigation`
- Server functions: `cookies()`, `headers()`, `draftMode()`, `after()` from `next/server`
- Generate functions: `generateStaticParams()`, `generateMetadata()`

## Component Patterns

**Server Components:**

- Fetch directly, parallel async with `Promise.all()`
- Pass minimal serializable data to Client Components
- Wrap async children in `<Suspense>`

**Client Components:**

- No prop drilling through layers
- Memoized handlers or use refs
- Dynamic imports for heavy code
- State subscriptions minimized

**Hooks/Utils:**

- Primitive dependencies
- Memoized calculations
- Cleanup all resources
- No memory leaks from listeners

## Common Mistakes

- ❌ Async client component (`'use client'` + `async function`)
- ❌ Passing `new Date()`, `new Map()`, functions to Client Components
- ❌ Sequential awaits instead of `Promise.all()`
- ❌ `useSearchParams()` without `<Suspense>`
- ❌ Wrapping navigation APIs in try-catch
- ❌ `route.ts` + `page.tsx` in same folder
- ❌ Metadata in `'use client'` files
- ❌ `@vercel/og` instead of `next/og`
- ❌ Using `&&` for conditional rendering (use `? :`)
- ❌ Barrel imports in hot paths

---

# Clerk Authentication Best Practices

## Setup & Configuration

- [ ] **Single Middleware**: One `clerkMiddleware()` at root, use `createRouteMatcher` for route groups
- [ ] **Route Protection**: Use `auth.protect()` explicitly in middleware for protected routes
- [ ] **Env Variables**: All keys in `.env`, never hardcoded; `CLERK_SECRET_KEY` server-only

## Server Components (App Router)

- [ ] **Auth Check**: Use `const { userId, orgId, orgRole } = await auth()` - returns nulls, not errors
- [ ] **Full User**: Use `currentUser()` only when full profile needed (extra DB call). Prefer adding required fields to session claims/token via Clerk Dashboard → Sessions → Customize session token
- [ ] **Early Returns**: Check `if (!userId)` immediately; redirect or throw, don't render partial

## Client Components

- [ ] **isLoaded First**: Always check `isLoaded` before `isSignedIn` - prevents hydration flicker
- [ ] **useAuth for Tokens**: Use `getToken()` for API calls; cache tokens, don't refetch per-request
- [ ] **useUser Sparingly**: Prefer `useAuth` for auth state; `useUser` triggers re-renders on profile changes

## API Routes / Server Actions

- [ ] **Always Verify Server-Side**: Never trust client-side auth state; re-verify with `await auth()`
- [ ] **Token Validation**: Pass `getToken()` result in Authorization header; verify on server
- [ ] **Scope Queries**: Always filter by `userId` or `orgId` in DB queries - never return unscoped data

## Webhooks

- [ ] **Verify Signatures**: Always verify `svix-signature` before processing Clerk webhooks
- [ ] **Idempotent Handlers**: Webhooks can retry; ensure create operations are idempotent (upsert, not insert)
- [ ] **Return 200**: Always return 200 after verification, even if processing fails (retry logic)

## Security Checklist

- [ ] **Metadata Usage**: `publicMetadata` client-visible; `privateMetadata` server-only; never store secrets
- [ ] **Auth in Server Actions**: Verify auth at action start, throw if unauthorized
- [ ] **Sensitive Operations**: Critical actions (delete, billing) require server-side role verification

## Common Patterns

```typescript
// Server Component pattern
const { userId, orgId } = await auth()
if (!userId) redirect('/sign-in')
if (!orgId && isB2B) redirect('/select-org')

// API Route pattern
const { userId } = await auth()
if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
const data = await db.query.where({ userId }) // Always scope

Session Token Customization (Clerk Dashboard → Sessions)
Add custom claims instead of calling currentUser():
{
  "email": "{{user.primary_email_address}}",
  "role": "{{user.public_metadata.role}}"
}
Then access in code: const { sessionClaims } = await auth()
const userRole = sessionClaims?.role
```
