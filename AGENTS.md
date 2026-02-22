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

---

# Inngest Best Practices

## Core Concepts & Structure
- [ ] **Event Naming**: Use consistent `object.action` format (e.g., `user.created`).
- [ ] **Single-Purpose Steps**: Keep functions focused. Use steps as atomic checkpoints that persist results and handle retries.
- [ ] **Idempotency**: Ensure events and functions are idempotent where necessary.

## Performance & Flow Control
- [ ] **Async Offloading**: Offload non-critical tasks from API endpoints to Inngest functions.
- [ ] **Flow Control**: Utilize built-in concurrency limits, rate limiting, debouncing, and batching.
- [ ] **Parallel Execution**: Run step functions in parallel to speed up workflows when appropriate.

## Error Handling & Observability
- [ ] **Error Granularity**: Catch and throw specific errors within steps to control retry behavior.
- [ ] **Logging**: Use console logs within functions for real-time visibility in the Inngest UI.
- [ ] **Environments**: Maintain strict isolation between dev, staging, and prod environments.

---

# Prisma Best Practices

## Schema & Modeling
- [ ] **Naming Conventions**: Singular PascalCase for models, camelCase for fields.
- [ ] **Indexing**: Verify indexes (`@@index`, `@unique`) for relation fields, especially in `relationMode`.
- [ ] **Source of Truth**: The `schema.prisma` file is the definitive data layer definition.

## Query Optimization
- [ ] **Avoid N+1 Queries**: Use `include` or `in` filters instead.
- [ ] **Selective Retrieval**: Use `select` to fetch only necessary fields.
- [ ] **Bulk Operations**: Prefer `createMany`, `updateMany`, and `deleteMany`.
- [ ] **Connection Pooling**: Use a single `PrismaClient` instance to prevent connection exhaustion.

## Migrations & Stability
- [ ] **Migrations Workflow**: Use `prisma migrate` in CI/CD, and `prisma db push` in prototyping/PlanetScale.
- [ ] **Validation**: Validate input (e.g. Zod) before executing Prisma queries.
- [ ] **Data Layer Locale**: Keep `PrismaClient` usage inside the data access layer, away from UI code.

---

# Zustand Best Practices

## Organization & Structure
- [ ] **Logical Slices**: Separate stores logically; avoid a massive unorganized single store.
- [ ] **Separation of Concerns**: Uncouple UI components from store implementations via container components.

## Performance Optimization
- [ ] **Atomic Selectors**: Use selectors to subscribe only to specific needed state slices. Avoid `useStore(state => state)`.
- [ ] **New Object Avoidance**: Do not return new object literals in selectors to prevent unnecessary re-renders. Use component-level or `shallow` selection.
- [ ] **Memoization**: Cache computationally expensive derived states.

## Integration & Maintenance
- [ ] **Immutability**: Avoid direct state mutation; apply middleware like Immer for complex nesting.
- [ ] **useEffect Trap**: Minimize reacting to store changes directly inside `useEffect` logic.
- [ ] **State Separation**: Use Zustand for global client state. Keep transient UI state local. 

---

# Optimistic UI (Act First, Sync Later) Best Practices

## Zustand (Act First & Revert on Failure)
- [ ] **Optimistic Updates**: Immediately mutate the Zustand store to the expected state before the network request initiates.
- [ ] **Snapshotting**: Capture the previous state (`const previousState = get().items`) before committing the optimistic update.
- [ ] **Graceful Revert**: In the `.catch()` block of the API request, immediately revert the store back to the snapshot and show an error toast.
- [ ] **Normalization Merge**: On a successful response, update the store by merging any server-generated data (e.g., real database IDs replacing local temp IDs).

## Inngest (Background Syncing)
- [ ] **Non-Blocking Execution**: Use Inngest to decouple the UI interaction from the heavy lifting, ensuring the user immediately proceeds while background sync happens.
- [ ] **Idempotent Webhooks**: If external services trigger the completion of the "Act First" interaction, consume them via Inngest and ensure the handler checks for existing records (e.g., using Prisma `upsert`).
- [ ] **Status Broadcasting**: For long-running optimism, optionally use Server-Sent Events (SSE) within an Inngest step to broadcast real-time confirmations back to the Zustand store.

## Prisma (Deterministic Validation & Source of Truth)
- [ ] **Temp-ID Resolution**: If the frontend generated a temporary UUID for the optimistic update, ensure Prisma accepts it, or handles returning the _real_ ID quickly for the frontend to reconcile.
- [ ] **Data Integrity**: Enforce constraints strictly at the Prisma level (e.g., `@@unique`). If the optimistic UI assumes a unique constraint is met but Prisma rejects it, the failure will appropriately trigger the Zustand revert mechanism.
