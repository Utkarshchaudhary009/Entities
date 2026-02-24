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

## Admin Layout Architecture
The admin section uses a server/client component split:
- `layout.tsx` (server): Guards access via Clerk `auth()` and checks `user_role === "admin"`.
- `layout-client.tsx` (client): Activates sidebar context and renders `<AdminSidebar>`.

## Sidebar State Management
Sidebar visibility is managed via a Zustand store (`src/stores/sidebar.store.ts`):
- `isOpen`: Controls slide-in panel visibility (mobile).
- `enabled`: Set by admin layout to show hamburger in Topbar.
- Actions: `toggle()`, `open()`, `close()`, `setEnabled()`.

Components access sidebar state via `useSidebar()` hook from `src/contexts/sidebar-context.tsx`.

## Shared Admin Components
- **DataTable** (`src/components/admin/data-table.tsx`): Generic, paginated table component. Receives data/meta from store, emits page/search callbacks. No internal fetching.
- **AdminSidebar** (`src/components/admin/sidebar.tsx`): Slide-in navigation panel. Mobile overlay, desktop fixed-width.

## Icon Library
Uses `@hugeicons/core-free-icons` and `@hugeicons/react` for all iconography. Do not use `lucide-react`.

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
