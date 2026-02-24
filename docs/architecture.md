# Architecture

## System Flow
The codebase follows this flow:

`Postgres (Prisma) -> Service Layer -> Next.js Route Handlers -> Zustand Store -> UI Components`

## Layer Responsibilities

### 1. Database and Models
- Source of truth: `prisma/schema.prisma`
- Prisma client output: `src/generated/prisma`
- Models cover commerce and brand domains: products, variants, carts, orders, discounts, brands, founders, social links, documents.

### 2. Service Layer (`src/services`)
- Owns business logic and Prisma calls.
- Route handlers should call services instead of querying Prisma directly.
- Handles common failure mapping through `handlePrismaError`.

### 3. API Layer (`src/app/api/**/route.ts`)
- Validates input with Zod schemas (`src/lib/validations` and query schemas).
- Enforces role/auth guards via `requireAuth` and `requireAdmin`.
- Uses standardized API helpers from `src/lib/api/response.ts`.
- Emits domain events through `safeInngestSend` for CRUD side effects.

### 4. Store Layer (`src/stores`)
- UI-facing data orchestration.
- Handles:
  - request deduping (`createRequestDeduper`)
  - optimistic CRUD updates
  - loading and error state
  - API payload unwrapping (`fetchApi`, `coercePaginatedResponse`)
- UI should call store actions, not `fetch` directly.

### 5. UI Layer (`src/components`, `src/app`)
- Renders store state and triggers store actions.
- Should remain side-effect-light and network-agnostic.

## Auth and Access Control
- `src/proxy.ts` applies Clerk middleware and protects non-public routes.
- Route handlers still enforce operation-level authorization with guard helpers.
- Role extraction is centralized in `src/lib/auth/guards.ts`.

## API Response Contract Notes
- Primary success patterns:
  - `successDataResponse(payload)` for non-paginated resources
  - `createdDataResponse(payload)` for created resources
  - `cachedPaginatedResponse({ data, meta })` for paginated lists
- Current implementation includes mixed paginated wrappers on some routes; see `docs/review-report.md` for details.

## Error Handling
- Domain and persistence errors mapped through `src/lib/errors.ts`.
- API layer uses `handleError` to convert thrown errors into HTTP responses.
- Unknown errors are logged server-side and returned as `500 Internal Server Error`.
