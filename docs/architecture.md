# Architecture

## System Flow
The codebase follows this flow:

`Postgres (Prisma) -> Service Layer -> Next.js Route Handlers -> Zustand Store -> UI Components`

## Layer Responsibilities

### 1. Database and Models
- Source of truth: `prisma/schema.prisma`
- Prisma client output: `src/generated/prisma`
- Models cover commerce and brand domains: products, variants, carts, orders, discounts, brands, founders, social links, documents.
- **Prisma Client Setup** (`src/lib/prisma.ts`):
  - Uses `PrismaPg` adapter with a `pg` Pool connection for serverless compatibility.
  - Connection string priority: `SUPABASE_POSTGRES_URL_NON_POOLING` (preferred) → `DATABASE_URL` → `SUPABASE_POSTGRES_URL`.
  - SSL configured with `rejectUnauthorized: false` for Supabase/managed Postgres.
  - Global singleton pattern in development to prevent connection pool exhaustion.

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

## Admin Dashboard
The admin dashboard provides KPI summary and order insights via the standard architecture flow:

- **Route**: `GET /api/admin/dashboard` — protected by `requireAdmin` guard
- **Service**: `src/services/admin-dashboard.service.ts` aggregates:
  - Order counts (total, pending)
  - Revenue total
  - Low-stock variants (threshold: 5)
  - Active discounts
  - Recent orders (last 6)
  - Status breakdown (groupBy)
- **Store**: `src/stores/admin-dashboard.store.ts` manages `overview`, `isLoading`, `error` states
- **UI**: `src/app/admin/dashboard/page.tsx` renders stat cards, recent orders, and status breakdown

## Brand Domain Architecture
The brand domain models support multi-brand commerce with founder profiles:

- **Brand**: Core brand entity with `name`, `tagline`, `brandStory`, support contacts, and `founderId`. One-to-one with `Founder`.
- **BrandPhilosophy**: Optional brand philosophy with `mission`, `vision`, `values[]`, `story`, `heroImageUrl`. One-to-one with `Brand`.
- **Founder**: Founder profile with `name`, `age`, `story`, `education`, `quote`, `thumbnailUrl`. Can have multiple `SocialLink`s.
- **SocialLink**: Platform links attached to either `Brand` or `Founder` (nullable foreign keys).
- **BrandDocument**: Policy documents (`DocumentType` enum: `RETURN_POLICY`, `SHIPPING_POLICY`, `REFUND_POLICY`, `PRIVACY_POLICY`, `TERMS_AND_CONDITIONS`) with versioning.

Relationships: `Founder -> Brand (1:1) -> BrandPhilosophy (1:1)`, `Brand -> BrandDocument[]`, `Brand -> SocialLink[]`, `Founder -> SocialLink[]`.

## Order Domain
- **OrderStatus enum**: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`. Managed via `ORDER_STATUSES` in `src/types/domain.ts`.
- **Soft delete**: Orders use `deletedAt` timestamp for soft deletes. Queries filter `deletedAt: null` by default in `OrderService`.
- **Stock management**: Order creation atomically decrements variant stock within a transaction; fails with `ValidationError` if insufficient.
- **Compensation pattern**: Order creation includes rollback logic — if cart clearing fails after order creation, the order is soft-deleted to maintain consistency.
- **Admin Order Management**:
  - List view (`/admin/orders`): Paginated table with search (order #, customer, email) and status filter. URL-synced query params.
  - Detail view (`/admin/orders/[orderId]`): Customer info, shipping address, order items, and admin management card for status updates and internal notes.
  - API (`/api/orders/[id]`): GET (auth required; admins see all, users see their own), PUT (admin only; triggers Inngest event on status change), DELETE (admin only; soft delete).
- **Intent Prefetching**: Order list rows trigger `fetchOne` on hover to hydrate detail page cache before navigation.

## UI Components
- **shadcn/ui**: Install via `bunx --bun shadcn@latest add <name>`. Components in `components/ui/`.
- **Drawer**: `vaul`-based drawer component (`src/components/ui/drawer.tsx`) supports bottom/left/right/top directions with animated overlay.
- **Icon Library**: Uses `@hugeicons/core-free-icons` and `@hugeicons/react` for all iconography. Do not use `lucide-react`.

## Seed Data System (`prisma/seed.ts`)
- Tagged seed data with `SEED::ENTITIES` prefix for safe identification and cleanup.
- Creates: founders, brands, categories, products, variants, colors, sizes, discounts, orders (100), carts (20).
- Modes:
  - Default (`bun db:seed`): Cleans existing seed data, then creates fresh test data.
  - Clean-only (`--clean` flag): Removes seed data without reseeding.
- Includes progress bars for visual feedback during bulk operations.

## Utility Hooks (`src/hooks`)
- **useDebounce**: Debounces a value with configurable delay (default 500ms). Used for search input debouncing in admin tables.

## Auth and Access Control
- `src/app/admin/proxy.ts` applies Clerk middleware and protects non-public routes with admin-specific role checks.
- Route handlers still enforce operation-level authorization with guard helpers.
- Role extraction is centralized in `src/lib/auth/guards.ts`.
- **Available guards**:
  - `requireAuth()`: Validates authenticated user, returns role from session claims.
  - `requireAdmin()`: Requires `role === "admin"`, returns 403 otherwise.
  - `requireOwnership(resourceOwnerId)`: Validates user owns the resource; admins bypass ownership check.
  - `requireRole(allowedRole)`: Validates user has specific role.

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
