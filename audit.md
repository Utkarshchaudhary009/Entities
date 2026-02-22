# Audit (Bug Catch + Best Practices)

Date: 2026-02-22

## Summary

Primary issues were broken Next.js/Clerk edge auth wiring, multiple client↔API contract mismatches (response shapes, routes, payload keys), missing API routes that Zustand stores call, and missing ownership checks for carts. Fixes align the codebase with “act first, sync later” optimistic updates (revert only on failure) and SWR-like cache-then-revalidate patterns.

## Problems Found (Exact)

1) **Clerk middleware/proxy not applied**
- The repo had auth logic in `src/proxy.ts`, but Next.js only loads `middleware.ts` (Next <=15) or `proxy.ts` at the project root (Next 16+). As a result, route protection could be silently skipped.

2) **Role resolution from Clerk session claims was brittle**
- `src/lib/auth/guards.ts` read role only from `sessionClaims.metadata.role`, while `src/app/api/admin/role/route.ts` writes role to `publicMetadata.role`. This mismatch could cause admins to be treated as users.

3) **Client stores expected a different API response contract**
- Several stores used `json.data.data`, but route handlers commonly return `NextResponse.json(result)` where `result` is `{ data, meta }` (no wrapper), and detail GETs return the domain object directly.
- Many stores also ignored `res.ok`, so failures could produce misleading state updates.

4) **Cart client store called non-existent endpoints and wrong payload keys**
- `src/stores/cart.store.ts` used `/api/cart/items` and sent `{ variantId }`, but the server exposes `/api/cart` and expects `{ productVariantId }` and requires `sessionId` in the query string.

5) **Cart ownership was not enforced**
- `Cart` has a `clerkId` column, but cart operations did not bind/verify ownership, enabling cross-user cart reads/mutations if a `sessionId` leaks.

6) **Orders API route missing but store uses it**
- `src/stores/order.store.ts` fetches `/api/orders/:id` and updates `/api/orders/:id`, but the repo only had `src/app/api/orders/route.ts`.

7) **Order status contract mismatch (case/values)**
- Prisma uses uppercase enum values (`PENDING`, `PROCESSING`, …) while `orderQuerySchema` previously accepted lowercase (`pending`, `confirmed`, …). This could silently break filtering.

8) **Product sorting incomplete**
- `productQuerySchema` allows `oldest`, but `src/services/product.service.ts` didn’t implement it.

9) **Missing API routes for sizes/colors/discounts**
- Stores call `/api/sizes`, `/api/colors`, `/api/discounts`, but these routes did not exist under `src/app/api/` in the repo state reviewed.

## Fixes Applied (Exact)

### Auth / Clerk (best practice: single root middleware)
- Added **root** `proxy.ts` (Next 16+) and **root** `middleware.ts` (compat), both using `clerkMiddleware()` + `createRouteMatcher()` + `auth.protect()`.
  - Files: `proxy.ts`, `middleware.ts`
  - Removed unused/wrong-location file: `src/proxy.ts`

- Made role extraction robust across common claim locations (`role`, `metadata.role`, `publicMetadata.role`, `public_metadata.role`) and validated via `isValidRole`.
  - File: `src/lib/auth/guards.ts`

### API error semantics
- `handleError()` now returns correct status/payload for app-level errors (`AppError`) instead of always returning 500, while still returning Zod issues as 400.
  - File: `src/lib/api/response.ts`

### Cart: contract + ownership + “act first, revert on failure”
- Bound carts to `clerkId` on first authenticated access and enforced ownership for:
  - reading cart (`getCartWithDetails`, `getCartSummary`)
  - adding items (`addItem`)
  - updating/removing items (`updateItem`, `removeItem`)
  - clearing cart (`clearCart`)
  - Files: `src/services/cart.service.ts`, `src/lib/errors.ts` (added `ForbiddenError`)

- API contract aligned with client usage:
  - `GET /api/cart?sessionId=...` returns **summary** `{ items, subtotal, itemCount }` (stable for UI)
  - `POST /api/cart?sessionId=...` expects `{ productVariantId, quantity }`
  - Added `DELETE /api/cart?sessionId=...` to clear cart
  - File: `src/app/api/cart/route.ts`

- Client cart store updated to:
  - call existing endpoints and include `sessionId` query
  - send correct payload keys
  - revert optimistic changes only on failure (uses snapshot `previousItems`)
  - File: `src/stores/cart.store.ts`

### Orders
- Implemented missing route handler:
  - `GET /api/orders/[id]` (admin sees any; user sees owned only)
  - `PUT /api/orders/[id]` (admin-only) to update status
  - File: `src/app/api/orders/[id]/route.ts`

- Normalized order status query to uppercase and validated against `ORDER_STATUSES`.
  - File: `src/lib/api/query-schemas.ts`
- Added `updateOrderStatusSchema` and fixed `sessionId` validation to match server usage (query param, not necessarily UUID).
  - File: `src/lib/validations/order.ts`

### Products
- Implemented `sort=oldest`.
  - File: `src/services/product.service.ts`

### Missing API routes (sizes/colors/discounts)
- Added services and route handlers to match existing Zustand calls:
  - Files: `src/services/size.service.ts`, `src/services/color.service.ts`, `src/services/discount.service.ts`
  - Routes: `src/app/api/sizes/route.ts`, `src/app/api/sizes/[id]/route.ts`,
    `src/app/api/colors/route.ts`, `src/app/api/colors/[id]/route.ts`,
    `src/app/api/discounts/route.ts`, `src/app/api/discounts/[id]/route.ts`

### Client store ↔ API response shape alignment (and res.ok checks)
- Updated stores to treat API responses as:
  - list endpoints: `{ data, meta }`
  - detail endpoints: the object directly
- Added `res.ok` guards before parsing to avoid committing invalid optimistic reconciliations.
  - Files: `src/stores/product.store.ts`, `src/stores/category.store.ts`,
    `src/stores/discount.store.ts`, `src/stores/attribute.store.ts`,
    `src/stores/brand.store.ts`, `src/stores/order.store.ts`

## Contract Changes (Inputs/Outputs)

- `GET /api/cart?sessionId=...` now returns `{ items, subtotal, itemCount }` (previously returned the Prisma cart shape). Client code in `src/stores/cart.store.ts` already expects `data.items`.
- `POST /api/cart?sessionId=...` expects `productVariantId` (not `variantId`).
- Added `DELETE /api/cart?sessionId=...`.
- Added `GET/PUT /api/orders/[id]` which matches `src/stores/order.store.ts`.

## Security/Privacy Review Notes

- Cart operations now enforce `clerkId` ownership and throw `ForbiddenError` on mismatch to prevent cross-user access via guessed/leaked `sessionId`.
- `handleError()` returns sanitized error payloads (message + code) for `AppError` and avoids leaking internal stack traces in responses.

## Optimistic UI / SWR-ish Behavior

- Stores keep “act first” optimistic updates and only revert on failure:
  - Cart store uses snapshots (`previousItems`) and server reconciliation via `syncWithServer()`.
  - Generic store factory already uses temp IDs and replaces them on success.
- “SWR-like” behavior remains cache-first in several stores (`fetchOne` / `fetchProduct` / `fetchOrder`) with room to add background revalidation if desired.

## Tests Added

- Added a focused test for error semantics and status normalization:
  - File: `tests/error-handling.test.ts`
  - Covers one negative case (`invalid status`) and AppError handling.

## Verification Gaps

- Full TypeScript type-check and full test run were not completed here due to execution restrictions/timeouts in this environment; recommended locally:
  - `bun run safe`
  - `bun test`

