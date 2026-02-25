# Repository Review Report

Date: 2026-02-25

## Scope
- Reviewed repository structure, Prisma schema, API routes, service layer, Zustand stores, auth guards, and tests.
- Validated architecture flow against project rule: `DB -> Service -> API -> Store -> UI`.
- Reviewed new Admin Category Management implementation.

## Findings

### High
1. Dynamic server log message pattern weakens log consistency rules.
   - Reference: `src/lib/api/response.ts:90`
   - Detail: `console.error(`${context} failed`, error)` uses a dynamic message string, while project guidance asks for static logger/console strings.
   - Risk: Harder log aggregation and searching in production.

### Medium
1. Paginated endpoints are not fully shape-consistent across routes.
   - References:
     - `src/app/api/orders/route.ts:33`
     - `src/app/api/product-variants/route.ts:17`
   - Detail: These routes return `successDataResponse(result)` where `result` is already a paginated object. Other list routes commonly return top-level paginated payloads.
   - Risk: Client parsing remains workable today (`unwrapApiPayload` handles nested shapes), but this increases contract ambiguity and onboarding cost.

2. Product detail fetch keeps stale cached data visible on fetch failure.
   - References:
     - `src/stores/product.store.ts:117`
     - `src/stores/product.store.ts:119`
     - `src/stores/product.store.ts:124`
   - Detail: `fetchProduct` sets cached product first, then runs network request. On request failure, stale cached data remains visible while only `error` is set.
   - Risk: User sees outdated details without clear stale-state handling.

### Low
1. Console usage is repeated across shared store factory methods.
   - References:
     - `src/stores/factory.ts:184`
     - `src/stores/factory.ts:228`
     - `src/stores/factory.ts:258`
     - `src/stores/factory.ts:368`
     - `src/stores/factory.ts:413`
     - `src/stores/factory.ts:446`
   - Detail: Repeated direct `console.error` calls instead of a centralized logging utility.
   - Risk: Inconsistent observability semantics and duplicated patterns.

## Strengths
1. Clear layered backend design is present in core features.
   - Example: products route handlers call `productService`, and `productService` owns Prisma access.
2. UI data-fetching is store-driven and avoids direct component-to-API calls in inspected code.
3. Optimistic UI patterns and request deduping are implemented in shared store utilities.
4. Route guards are consistently applied for admin-protected write operations.
5. Test structure is organized by unit and integration layers.
6. Admin Category Management follows established patterns:
   - Store uses `createEntityStore` factory for consistent CRUD behavior
   - `CategoryDrawer` demonstrates react-hook-form + Zod resolver pattern
   - Auto-generated slug from name field via form watchers; respects manual edits via `dirtyFields` tracking

## Recommended Next Actions
1. Standardize list response envelopes for paginated GET endpoints.
2. Introduce a shared logger helper with static event names and structured metadata.
3. Add stale-data policy to detail stores (`stale`, `lastFetchedAt`, or rollback behavior).
4. Document API and store contracts in one place and enforce with tests.
5. Add API contract tests for paginated endpoints to block response-shape drift.
