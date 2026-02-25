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

## Admin Product Management
Product administration follows the standard architecture flow:

- **Routes**: 
  - `GET/POST /api/products` — list (paginated, searchable) and create
  - `GET/PUT/DELETE /api/products/[id]` — product detail with variants
  - `POST/PUT/DELETE /api/product-variants/[id]` — variant CRUD
- **Service**: `src/services/product.service.ts` handles product operations; `src/services/product-variant.service.ts` manages variants with stock tracking.
- **Store**: `src/stores/product.store.ts` manages:
  - Product list (`products`, `meta`, `isLoading`)
  - Product detail with variants (`product`, `variants`)
  - Optimistic CRUD with rollback on failure
  - Request deduping via `createRequestDeduper`
  - SWR-style cache hydration (displays cached data while fetching fresh)
- **UI**: 
  - `/admin/products` — DataTable with search, category filter, active toggle
  - `/admin/products/[productId]` — detail view with variant table
  - `ProductDrawer` — create/edit product form with ImageUpload for thumbnail
  - `VariantDrawer` — create/edit variant with size/color selectors and multi-image upload

### Variant Summary Type
`VariantSummary` type (`src/types/api.ts`) provides lightweight variant display fields: `id`, `size`, `color`, `colorHex`, `images[]`, `stock`, `sku`, `isActive`. Used in product detail responses to avoid full `ProductVariant` payload.

## Admin Category Management
Category administration follows the standard architecture flow:

- **Routes**: 
  - `GET/POST /api/categories` — list (paginated, searchable) and create
  - `GET/PUT/DELETE /api/categories/[id]` — category CRUD
- **Service**: `src/services/category.service.ts` handles category operations with search support and sort ordering.
- **Store**: `src/stores/category.store.ts` — generated via `createEntityStore` factory for standard CRUD state management.
- **Validation**: `src/lib/validations/category.ts` defines `createCategorySchema` (name, slug, thumbnailUrl, about, discountPercent, sortOrder, isActive).
- **UI**: 
  - `/admin/categories` — DataTable with columns for thumbnail, name, slug, discount %, active toggle, sort order
  - `CategoryDrawer` — bottom drawer for create/edit with react-hook-form + Zod resolver

### Form Handling Pattern
The `CategoryDrawer` component demonstrates the project's form pattern:
- `react-hook-form` with `@hookform/resolvers` for Zod schema integration
- `useForm` with `zodResolver(createCategorySchema)` for validation
- Auto-generated slug from name field using `watch` and `setValue`
- Store-driven submission with loading states and toast feedback

## Admin Color Management
Color administration follows the standard architecture flow:

- **Routes**:
  - `GET/POST /api/colors` — list (paginated) and create
  - `GET/PUT/DELETE /api/colors/[id]` — color CRUD
- **Service**: `src/services/color.service.ts` handles color operations with sort ordering.
- **Store**: `src/stores/color.store.ts` — generated via `createEntityStore` factory for standard CRUD state management.
- **Validation**: `src/lib/validations/color.ts` defines `createColorSchema` (name, hex, sortOrder).
- **UI**:
  - `/admin/colors` — DataTable with color swatches
  - `ColorDrawer` — bottom drawer for create/edit with native color picker synced to hex text input

### Hex Color Picker Pattern
The `ColorDrawer` implements a dual-input hex picker:
- Native browser color picker (`<input type="color">`) for visual selection
- Text input stays synced via `watch` and `setValue` with `shouldValidate: true`
- Color swatch preview updates in real-time via inline `backgroundColor` style

## Admin Size Management
Size administration follows the standard architecture flow:

- **Routes**:
  - `GET/POST /api/sizes` — list (paginated) and create
  - `GET/PUT/DELETE /api/sizes/[id]` — size CRUD
- **Service**: `src/services/size.service.ts` handles size operations with sort ordering.
- **Store**: `src/stores/size.store.ts` — generated via `createEntityStore` factory for standard CRUD state management.
- **Validation**: `src/lib/validations/size.ts` defines `createSizeSchema` (label, sortOrder, measurements).
- **UI**:
  - `/admin/sizes` — DataTable with size labels
  - `SizeDrawer` — bottom drawer for create/edit with form fields: label, sort order, measurements (JSON textarea)

### Measurements JSON Pattern
The `SizeDrawer` measurements field accepts arbitrary dimension key-value pairs:
- `measurements` is a flexible JSON object (`Record<string, string>`)
- Form includes a `Textarea` with `setValueAs` parser to convert JSON string to object on submit
- Includes placeholder example and validation feedback for invalid JSON

## Admin Discount Management
Discount administration follows the standard architecture flow:

- **Routes**: 
  - `GET/POST /api/discounts` — list (paginated, searchable) and create
  - `GET/PUT/DELETE /api/discounts/[id]` — discount CRUD
- **Service**: `src/services/discount.service.ts` handles discount operations.
- **Store**: `src/stores/discount.store.ts` — generated via `createEntityStore` factory for standard CRUD state management.
- **Validation**: `src/lib/validations/discount.ts` defines `createDiscountSchema` with fields:
  - `code`: required, auto-uppercased
  - `description`: optional, short note about the discount
  - `discountType`: enum (`PERCENTAGE`, `FIXED`, `BOGO`)
  - `value`: discount amount (percentage or fixed)
  - `minOrderValue`: minimum order threshold
  - `maxDiscount`: cap for percentage discounts
  - `usageLimit`: total redemptions allowed
  - `startsAt`, `expiresAt`: validity period
  - `isActive`: toggle for enabling/disabling
- **UI**: 
  - `/admin/discounts` — DataTable with columns for code, type badge, value, usage count, expiry, active toggle
  - `DiscountDrawer` — bottom drawer for create/edit with delete option in edit mode

### Discount Types
`DiscountType` enum (`src/types/domain.ts`):
- `PERCENTAGE`: percentage off (value = %)
- `FIXED`: fixed amount off (value = ₹)
- `BOGO`: buy one get one

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
- **Chart**: Recharts-based chart wrapper (`src/components/ui/chart.tsx`) with theme-aware CSS variable injection. Exports `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`. Uses dynamic imports for SSR safety.

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
- `src/proxy.ts` applies Clerk middleware with route-based access control:
  - Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`
  - Admin routes: `/admin(.*)` requires `role === "admin"` from session claims
  - All other routes require authentication via `auth.protect()`
  - Handles OPTIONS requests for CORS preflight
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

## File Upload Architecture

The upload system uses Supabase Storage with async Inngest processing for non-blocking uploads:

### Flow
`UI (ImageUpload) -> Upload Store -> API (/api/upload) -> Inngest Event -> Supabase Storage`

### Components
- **Route**: `POST /api/upload` — admin-protected, returns 202 Accepted immediately
- **Validation** (`src/lib/validations/upload.ts`): 
  - Max file size: 10MB
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`
- **Store** (`src/stores/upload.store.ts`): Manages upload state with `UploadEntry` tracking (pending, uploading, done, error), preview URLs via blob, and projected public URLs
- **Inngest Functions** (`src/inngest/functions/upload.functions.ts`):
  - `handleFileUpload`: Receives base64 file buffer, ensures bucket exists, uploads to Supabase
  - `handleFileDelete`: Removes files from storage by URL path extraction
- **Supabase Admin** (`src/lib/supabase/admin.ts`): Server-only client with bypass RLS privileges using `SUPABASE_SERVICE_ROLE_KEY`

### Inngest Events
- `storage/file.upload.v1`: `{ bucket, filename, fileBuffer (base64), contentType, actorId, idempotencyKey }`
- `storage/file.delete.v1`: `{ bucket, urls[], actorId, idempotencyKey }`

### ImageUpload Component
`src/components/admin/image-upload.tsx` provides file and URL image management:
- Drag-and-drop or click-to-upload files
- URL paste input for external images
- Background upload with status overlay (uploading spinner, done checkmark, error alert)
- Blob preview URLs during upload, swapped to public URLs on completion
- Configurable `maxImages` (default 10) and `bucket` prop

## Error Handling
- Domain and persistence errors mapped through `src/lib/errors.ts`.
- API layer uses `handleError` to convert thrown errors into HTTP responses.
- Unknown errors are logged server-side and returned as `500 Internal Server Error`.
