# Architecture

## System Flow
The codebase follows this flow:

`Postgres (Prisma) -> Service Layer -> Next.js Route Handlers -> Zustand Store -> UI Components`

## Next.js Configuration

The Next.js configuration (`next.config.ts`) sets important security and performance options:

- **Security Headers**: Applied globally via `headers()`:
  - `X-DNS-Prefetch-Control: on`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- API routes additionally receive `Cache-Control: private, no-store`.
- **Turbopack Cache**: File system caching enabled for both development (`turbopackFileSystemCacheForDev`) and build (`turbopackFileSystemCacheForBuild`) to improve performance.
- **Image Optimization**:
  - Modern formats: `image/avif`, `image/webp`
  - Long cache TTL: `31536000` seconds (1 year)
  - **Remote Image Patterns**: Allows images from specific Supabase bucket only:
    - `ffpfapdnnoasqvehcdff.supabase.co` (project storage bucket)

## Caching Strategy

The application implements a tiered caching strategy via the `cache-headers` utility (`src/lib/cache-headers.ts`). API routes select a cache tier based on data volatility and privacy requirements, using the `cached` helper functions.

### Cache Tiers

**Aggressive** (`cached.aggressive`)
- **Use case**: Public catalog data that changes infrequently (products, categories, catalog listings).
- **Headers**: `public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=86400`
- **CDN**: 24h, **SWR**: 7d, **stale-if-error**: 1d
- **Examples**: `GET /api/shop/catalog`, `GET /api/categories`, `GET /api/founders`, `GET /api/brand-documents`
- **Invalidation**: Mutations call `revalidatePath()` to purge CDN cache immediately.

**Static** (`cached.static`)
- **Use case**: Rarely changed public resources (brands, founders, philosophies, social links).
- **Headers**: `public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=3600`
- **CDN**: 1h, **SWR**: 24h, **stale-if-error**: 1h
- **Examples**: `GET /api/brands/[id]`, `GET /api/products/[id]` (public details)
- **Invalidation**: Brand/product mutations call `revalidatePath()` on affected routes.

**Dynamic** (`cached.dynamic`)
- **Use case**: Semi-public or frequently refreshed data (variant media, non-critical real-time data).
- **Headers**: `public, s-maxage=60, stale-while-revalidate=300`
- **CDN**: 1m, **SWR**: 5m
- **Examples**: `GET /api/shop/products/[id]/variant-media`
- **Invalidation**: Not typically applicable due to short TTL.

**Private** (`cached.private`)
- **Use case**: Authenticated user-specific data (admin-only dashboards, user profiles) that should not be stored by CDN.
- **Headers**: `private, max-age=60, stale-while-revalidate=60`
- **CDN**: Never stores; **Browser**: 60s
- **Status**: Defined in utility but not yet in use across API routes.
- **Invalidation**: Not applicable; data is user-specific.

**NoStore** (`cached.noStore`)
- **Use case**: Highly sensitive or real-time data (cart, orders, payments, admin product list).
- **Headers**: `no-store`
- **CDN/Browser**: No caching at any layer.
- **Examples**: `GET /api/products` (admin query), other admin-sensitive endpoints.
- **Invalidation**: Not applicable; always fresh.

### Cache Invalidation Pattern

Mutation endpoints (POST/PUT/DELETE) that modify cached resources call `revalidatePath()` to purge CDN cache for affected routes. For example, creating a product calls:

```typescript
revalidatePath("/api/products");
revalidatePath("/api/shop/catalog");
```

Brand mutations additionally bust the homepage ISR cache: `revalidatePath("/")`.

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
  - optimistic CRUD updates with automatic rollback
  - granular loading and error states per operation
  - API payload unwrapping (`fetchApi`, `coercePaginatedResponse`)
  - cache hydration and SWR patterns
- Two store patterns:
  - **Custom stores**: Hand-written for complex domain logic (e.g., cart, user preferences)
  - **Factory-generated stores**: `createEntityStore` and `createGenericStore` provide standardized CRUD for simple entities
- UI should call store actions, not `fetch` directly.

#### Store Factory Patterns
The store factory provides reusable patterns for common CRUD operations:

**`createEntityStore<TItem, TCreate, TUpdate, TExtend>`**
Generates a fully-featured store for entity management with optimistic updates and request deduping. Used by most admin entity stores (categories, discounts, etc.).

The factory accepts an optional `schemas` argument:
- `schemas.create?: z.ZodType<TCreate>` – validates data on `create()`
- `schemas.update?: z.ZodType<TUpdate>` – validates data on `update()`

When schemas are provided, validation occurs before optimistic updates. Failed validations set the store's `error` with a formatted message, log a warning, and abort the operation without an API call.

Generated State:
- `items: TItem[]`, `selectedItem: TItem | null`, `meta: Meta`, `isLoading: boolean`, `error: string | null`
- Standard setters: `setItems()`, `setMeta()`, `setSelectedItem()`, `setError()`, `setLoading()`
- CRUD operations:
  - `fetchAll(params?)` – fetches paginated list, updates `items` and `meta`
  - `fetchOne(id)` – fetches single item, caches in `items`, updates `selectedItem`
  - `create(data)` – validates (if schema), performs optimistic create with temp ID, rolls back on failure
  - `update(id, data)` – validates (if schema), performs optimistic patch, rolls back on failure
  - `delete(id)` – optimistic delete with rollback

Extension Pattern: Pass an `extend` callback to add custom state fields and actions while inheriting all base functionality.

DevTools: Store names autogenerated from provided `storeName` parameter; enabled only in development.

**`createGenericStore<T>`**
Simplified version for generic collections without pagination expectations. Provides same CRUD operations but with simpler `fetchAll(endpoint, params)` signature that accepts explicit endpoint.

Both factories implement:
- Optimistic UI with `crypto.randomUUID()` temp IDs
- Automatic rollback on API failures
- Request deduping based on method+endpoint+params
- Detailed console logging with store name prefixes
- Consistent error state management

Reference implementation: `src/stores/factory.ts`.

#### Custom Stores
Some domains require hand-written stores for complex state management that exceeds factory patterns:

- **Brand Store** (`src/stores/brand.store.ts`): Manages brand profile with nested relationships (founder, documents, social links, philosophy). Provides dedicated `fetchBrandDetails(id)` to populate compound state, plus full CRUD with optimistic updates. Uses request deduplication, validation via Zod schemas, and granular loading/error states.

- **Product Store** (`src/stores/product.store.ts`): Handles product catalog with pagination (`products`, `meta`) and detail view (`product`, `variants`). Uses cache-first fetching for product details (`fetchProductOverview` returns cached data when available). Supports product and variant CRUD with optimistic updates and rollback. Uses dedicated helper utilities (`buildSearchParams`, `coercePaginatedResponse`, `unwrapApiPayload`) for API payload normalization.

Custom stores follow the same principles as factory-generated stores: optimistic UI, request deduplication, granular state, and consistent error handling.

### 5. UI Layer (`src/components`, `src/app`)
- Renders store state and triggers store actions.
- Should remain side-effect-light and network-agnostic.

#### Root Layout (`src/app/layout.tsx`)
The root layout establishes the global UI framework:
- Uses `<ClerkProvider>` for authentication context.
- `<html>` includes `suppressHydrationWarning` to avoid theme class hydration mismatches.
- `<ThemeProvider>` configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`.
- Integrates `<GoogleOneTap />` for seamless sign-in.
- Integrates `<PostHogProvider>` for analytics with Clerk user identification.
- Layout structure: fixed `<Topbar>` (64px), `<BottomNav>` for mobile, with content offset via `pt-16` and `pb-16` (mobile) / `pb-0` (desktop).
- `<Toaster>` from `sonner` displays notifications at `top-right` with rich colors.

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

## Shopping Cart Domain
The cart system provides session-based shopping cart management with optimistic updates and server synchronization:

- **Session Model**: Carts are tied to anonymous sessions via `sessionId` header; guest users maintain cart across visits.
- **API Routes** (`src/app/api/cart/**/route.ts`):
  - `POST /api/cart` — add item (creates or increments quantity)
  - `GET /api/cart` — returns cart summary with items and totals
  - `PUT /api/cart/[id]` — update quantity
  - `DELETE /api/cart/[id]` — remove item
  - `DELETE /api/cart` — clear all items
- **Store**: `src/stores/cart.store.ts` manages:
  - `items[]`, `sessionId`, `isLoading`, `error`
  - Optimistic add/update/remove with automatic rollback
  - Quantity merge on duplicate variant adds
  - `syncWithServer()` to reconcile state after page reload
  - Selector hooks: `useCartItems()`, `useCartIsLoading()`, `useCartError()`, `useCartTotal()`, `useCartCount()`
- **UX Patterns**:
  - Immediate UI updates on add (with temporary `temp_` prefixed IDs)
  - Duplicate variant detection and quantity merging
  - Automatic `syncWithServer` call when optimistic IDs persist (e.g., on page refresh)
  - Granular loading indicators; no global spinners
  - Error reversion with toast notifications

## Brand Domain Architecture
The brand domain models support multi-brand commerce with founder profiles:

- **Brand**: Core brand entity with `name`, `tagline`, `brandStory`, support contacts, and `founderId`. One-to-one with `Founder`.
- **BrandPhilosophy**: Optional brand philosophy with `mission`, `vision`, `values[]`, `story`, `heroImageUrl`. One-to-one with `Brand`.
- **Founder**: Founder profile with `name`, `age`, `story`, `education`, `quote`, `thumbnailUrl`. Can have multiple `SocialLink`s.
- **SocialLink**: Platform links attached to either `Brand` or `Founder` (nullable foreign keys).
- **BrandDocument**: Policy documents (`DocumentType` enum: `RETURN_POLICY`, `SHIPPING_POLICY`, `REFUND_POLICY`, `PRIVACY_POLICY`, `TERMS_AND_CONDITIONS`) with versioning.

Relationships: `Founder -> Brand (1:1) -> BrandPhilosophy (1:1)`, `Brand -> BrandDocument[]`, `Brand -> SocialLink[]`, `Founder -> SocialLink[]`.

## Admin Product Management
Product administration follows the standard architecture flow. Products and their variants are managed together, with variant attributes (size, color) defined as predefined constants rather than dynamic entities.

### Product Options (Colors and Sizes)
Available sizes and colors are defined as constant configurations in `src/lib/constants/product-options.ts`:
- `PRODUCT_SIZES`: Size definitions with labels and sort order (Free Size, XS, S, M, L, XL, XXL, 3XL)
- `PRODUCT_COLORS`: Color definitions with hex values and Tailwind CSS classes (30+ predefined colors)
- `VALID_SIZES` and `VALID_COLORS`: Type-safe arrays for validation and select options

This design eliminates separate color/size management endpoints and UI, simplifying the variant creation workflow.

- **Routes**:
  - `GET /api/products` — list products (**NoStore cache**, admin required, paginated, searchable; includes inactive products)
  - `POST /api/products` — create product (admin required)
  - `GET /api/products/[id]` — fetch product with variants (**Static cache**, 1h CDN, 24h SWR; public)
  - `PUT /api/products/[id]` — update product (admin required); busts `/api/products`, `/api/shop/catalog`, and homepage ISR cache
  - `DELETE /api/products/[id]` — delete product (admin required); removes product thumbnail and all variant images from storage via Inngest events; busts related caches
  - `GET /api/product-variants/[id]` — fetch variant details (public)
  - `PUT /api/product-variants/[id]` — update variant (admin required)
  - `DELETE /api/product-variants/[id]` — delete variant; removes variant images from storage (admin required)
  - `GET /api/admin/products/[id]/overview` — fetch product overview with variants and category (**NoStore**, admin required)
  - `GET /api/admin/product-variants/[id]/details` — fetch variant with full images and metadata (**NoStore**, admin required)
- **Service**: `src/services/product.service.ts` handles product operations; `src/services/product-variant.service.ts` manages variants with stock tracking.
- **Store**: `src/stores/product.store.ts` manages:
  - Product list (`products`, `meta`, `isLoading`)
  - Product detail with variants (`product`, `variants`)
  - Optimistic CRUD with rollback on failure
  - Request deduping via `createRequestDeduper`
  - Cache-first fetching: product details are loaded once and reused until explicitly refreshed
- **UI**: 
  - `/admin/products` — DataTable with search, category filter, active toggle
  - `/admin/products/[productId]` — detail view with variant table (no separate colors/sizes pages)
  - `ProductDrawer` — create/edit product form with ImageUpload for thumbnail
  - `VariantDrawer` — create/edit variant with size/color selectors (populated from `PRODUCT_SIZES` and `PRODUCT_COLORS`) and multi-image upload

### Variant Summary Type
`VariantSummary` type (`src/types/api.ts`) provides lightweight variant display fields: `id`, `size`, `color`, `colorHex`, `images[]`, `stock`, `sku`, `isActive`. Used in product detail responses to avoid full `ProductVariant` payload.

### Variant Drawer Pattern
`VariantDrawer` (`src/components/admin/variant-drawer.tsx`) demonstrates form handling for variant creation/editing:
- Uses react-hook-form principles with manual state and Zod validation via `createVariantSchema`
- Size and color dropdowns populated from `VALID_SIZES` and `VALID_COLORS` with color swatch previews
- ImageUpload component for variant images (stored in `variants` bucket)
- Stock and SKU management with active toggle
- Store-driven submission with `createVariant`/`updateVariant` actions and optimistic updates

## Shop Product Browsing

The public shop interface provides optimized product data fetching with tiered caching and per-color variant media aggregation.

- **Routes**:
  - `GET /api/shop/catalog` — fetch lightweight product index for browsing (**Aggressive cache**, 24h CDN, 7d SWR)
  - `GET /api/shop/products/[id]` — fetch public product details with active variants (**Dynamic cache**, 1m CDN, 5m SWR)
  - `GET /api/shop/products/[id]/variant-media?color=<color>` — fetch deduplicated image list for a specific color across active variants (**Dynamic cache**, 1m CDN, 5m SWR)

- **Store**: `src/stores/shop.store.ts` manages:
  - Product catalog with Fuse.js search (`catalog`, `filteredCatalog`, `searchQuery`)
  - Product detail hydration (`productDetailsById`) with lazy loading
  - Variant media cache (`variantMediaByProductId`) indexed by product ID and color
  - Granular loading states (`loadingProductIds`, `loadingVariantMediaByKey`)
  - Request deduping and cache-first patterns

- **UI Components**:
  - `ShopContent` (`src/app/(user)/shop/shop-content.tsx`) renders the catalog grid with category filtering and search. Default view shows "New Arrivals" section when no filters are active. Search input placeholder: "Search by product or category". Search results display count in format "Results for \"<query>\" (N products)".
  - `ProductDrawer` (`src/components/shop/product-drawer.tsx`) displays product details and variant selection, fetching media on-demand by color. Includes Color and Size selectors, image gallery with thumbnails, product description/material/fit/care info, and "Add to cart" button.

## Admin Category Management
Category administration follows the standard architecture flow:

- **Routes**:
  - `GET /api/categories` — list (**Aggressive cache**, 24h CDN; public, paginated, searchable)
  - `POST /api/categories` — create category (admin required)
  - `GET /api/categories/[id]` — fetch category (public, no special caching)
  - `PUT /api/categories/[id]` — update category (admin required)
  - `DELETE /api/categories/[id]` — delete category (admin required)
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

## Admin Discount Management
Discount administration follows the standard architecture flow:

- **Routes**:
  - `GET /api/discounts` — list (**Static cache**, 1h CDN, 24h SWR; admin required, paginated, searchable)
  - `POST /api/discounts` — create discount (admin required)
  - `GET /api/discounts/[id]` — fetch discount (public)
  - `PUT /api/discounts/[id]` — update discount (admin required)
  - `DELETE /api/discounts/[id]` — delete discount (admin required)
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

## Admin Brand Management
Brand administration manages the main brand profile and its social presence through a comprehensive store with full CRUD operations:

- **Route**: `src/app/admin/brand/page.tsx` (client component)
- **Store**: `src/stores/brand.store.ts` provides:
  - State: `brand` (with nested `founder`, `documents[]`, `socialLinks[]`, `philosophy`), `brands[]` (list), `isLoading`, `error`
  - Actions: `fetchBrandDetails(id)`, `createBrand(data)`, `updateBrand(id, data)`, `deleteBrand(id)`, `setBrands()`, `setError()`, `setLoading()`
  - Request deduping via `createRequestDeduper` prevents duplicate fetches
  - Optimistic updates for create/update/delete with automatic rollback on failure
- **API Routes**:
  - `GET /api/brands` — list (**Aggressive cache**, 24h CDN, 7d SWR; public, paginated/searchable). Additionally, this endpoint serves as a brand provider: if no active brand exists, it auto-creates a default "My Store" brand with a "Default Founder" to ensure the homepage and other brand-dependent features never fail with 500 errors.
  - `POST /api/brands` — creates brand; emits `entity/brand.created.v1` (admin required). Enforces single-brand architecture: rejects creation if any brand already exists.
  - `GET /api/brands/[id]` — fetches brand with founder, documents, social links, philosophy (**Static cache**, 1h CDN; public)
  - `PUT /api/brands/[id]` — updates brand; emits `entity/brand.updated.v1` (admin required); also calls `revalidatePath("/")` to bust homepage ISR cache
  - `DELETE /api/brands/[id]` — hard delete; emits `entity/brand.deleted.v1` (admin required); also calls `revalidatePath("/")` to bust homepage ISR cache
- **Validation**: `src/lib/validations/brand.ts` defines `createBrandSchema` and `updateBrandSchema` with fields:
  - `name`, `logoUrl`, `tagline`, `brandStory`, `supportEmail`, `supportPhone`, `isActive`, `founderId`
- **UI Pattern**:
  - Form uses `react-hook-form` with `zodResolver`
  - Two-column layout: primary form on left, contextual sidebar on right
  - Social links managed via `SocialLinksEditor` sub-component with `entityType="brand"`
  - Optimistic updates via store actions; toast feedback on success/failure

## Admin Founder Management
Founder profile administration manages the founder's public biography and social links:

- **Route**: `src/app/admin/founder/page.tsx` (client component)
- **State**: `src/stores/brand.store.ts` provides `founder`, `isLoading`, `fetchBrandDetails`
- **Additional Data**: Founder social links fetched separately from `/api/social-links?founderId=` since brand store does not populate them.
- **Validation**: `src/lib/validations/founder.ts` defines `createFounderSchema` with fields:
  - `name`: required
  - `age`: optional number
  - `story`: optional text (founder narrative)
  - `education`: optional free text
  - `quote`: optional personal quote
  - `thumbnailUrl`: optional profile image URL
- **UI Pattern**:
  - Form uses `react-hook-form` with `zodResolver`
  - Two-column layout: founder details form on left, social links editor below it
  - Sidebar provides contextual help text for About page placement
  - Social links via `SocialLinksEditor` with `entityType="founder"`
  - Independent API call for founder social links; state managed locally

## Admin Brand Documents Management
Brand documents administration provides a UI for managing policy documents (Return Policy, Shipping Policy, Refund Policy, Privacy Policy, Terms & Conditions) with Markdown editing and live preview.

- **Route**: `src/app/admin/brand-documents/page.tsx` (client component)
- **State**: Document state managed locally per document type; brand ID obtained from `useBrandStore`.
- **API Integration**:
  - `GET /api/brand-documents?brandId=<id>` — fetches documents for the brand (**Aggressive cache**, 24h CDN, 7d SWR)
  - `POST /api/brand-documents` — creates a new document
  - `PUT /api/brand-documents/[id]` — updates content and active status
- **UI Pattern**:
  - Tabbed interface (mobile: select dropdown) for document types
  - Active/inactive toggle with immediate visual feedback
  - Write/Preview modes with lightweight Markdown renderer
  - Dirty state tracking and unsaved changes warning on tab switch
  - Toast notifications for save success/failure

## Social Links Editor Component
The `SocialLinksEditor` (`src/components/admin/social-links-editor.tsx`) is a reusable client component for managing social links attached to either a Brand or Founder.

- **Props**: `entityId` (string), `entityType` (`"brand" | "founder"`), `initialLinks` (`SocialLink[]`), optional `onLinksChange` callback
- **API Integration**:
  - POST `/api/social-links` with `{ platform, url, brandId|founderId }`
  - DELETE `/api/social-links/[id]`
- **State**: Local `links`, `platform`, `url`, `isAdding`, `deletingId`
- **UX**: Immediate micro-interactions; button disabled during add/delete; toast notifications
- **Pattern**: Demonstrates store-mediated optimistic updates in parent pages while keeping component self-contained for link input/list.

## Home Page Architecture

The public home page (`src/app/page.tsx`) is a server component that aggregates brand and catalog data and renders a composed layout of five specialized sections:

- **Data Fetching**: Server-side parallel fetching using Prisma with ISR (`revalidate = 3600`).
- **Loaded Data**:
  - `brand`: Active brand record with `philosophy` and `socialLinks` (nested includes)
  - `featuredProducts`: 3 most recent active products with `isFeatured: true`, including category and pricing
  - `categories`: All active categories for footer navigation

### Home Page Sections

**HeroSection** (`src/components/home/hero-section.tsx`)
- Displays full-viewport hero with brand imagery and call-to-action.
- Props: `brand: Brand | null`
- Renders `brand.heroImageUrl` as background (with muted fallback) and overlays brand name, tagline, and "Discover the Selection" link to `/shop`.
- Uses `Brand` model fields: `heroImageUrl`, `name`, `tagline`, `brandStory`.

**FeaturedSection** (`src/components/home/featured-section.tsx`)
- Showcases 3 featured products in responsive grid.
- Props: `products: ProductData[]` (id, name, slug, price, thumbnailUrl, category)
- Displays product thumbnail, category, name, and price. Links to product detail via `/shop?product=<slug>`.
- Includes "Shop All" link to `/shop`.

**PhilosophySection** (`src/components/home/philosophy-section.tsx`)
- Renders brand mission, vision, and values.
- Props: `philosophy: BrandPhilosophy | null`
- Content priority: `mission` → `story` → default brand narrative. Displays `vision` as italic quote when present.
- Shows `values` as pill tags; includes "Discover More" link to `/about`.

**NewsletterSection** (`src/components/home/newsletter-section.tsx`)
- Email subscription form with client-side state.
- Uses local `useState` for email and loading; submits with optimistic toast feedback (`sonner`).
- No backend integration in current implementation; simulates success with `setTimeout`.

**HomeFooter** (`src/components/home/home-footer.tsx`)
- Full-width footer with 4-column layout and social links.
- Props: `categories: Category[]`, `socialLinks: SocialLink[]`
- Columns: Brand description, Collections (dynamic categories), Company links, Policy links.
- Social icons map via `PLATFORM_ICONS` using `@hugeicons/react`; unknown platforms fall back to a text label.

### Data Flow Summary

```text
HomePage (server)
  └─ prisma queries (brand + philosophy + socialLinks, featured products, categories)
      └─ props → child components (all client-capable, server-rendered)
```

All sections are pure presentational components with no direct API calls; data originates from the server component's Prisma queries. This maintains consistency with the `DB → UI` pattern for server-rendered pages.

## Order Domain
- **OrderStatus enum**: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`. Managed via `ORDER_STATUSES` in `src/types/domain.ts`.
- **Soft delete**: Orders use `deletedAt` timestamp for soft deletes. Queries filter `deletedAt: null` by default in `OrderService`.
- **Stock management**: Order creation atomically decrements variant stock within a transaction; fails with `ValidationError` if insufficient.
- **Compensation pattern**: Order creation includes rollback logic — if cart clearing fails after order creation, the order is soft-deleted to maintain consistency.
- **Admin Order Management**:
  - List view (`/admin/orders`): Paginated table with search (order #, customer, email) and status filter. URL-synced query params.
  - Detail view (`/admin/orders/[orderId]`): Customer info, shipping address, order items, and admin management card for status updates and internal notes.
  - **API Endpoints**:
    - `GET /api/orders` — fetch orders (auth required; admins see all, users see own orders); supports pagination (page, limit), status filter, and search.
    - `POST /api/orders` — create order from cart (auth required); emits `entity/order.created.v1`; includes stock validation and cart compensation.
    - `GET /api/orders/[id]` — fetch order details (auth required; admins see all, users see own)
    - `PUT /api/orders/[id]` — update order status or admin notes (admin required); emits `entity/order.status-changed.v1` on status change
    - `DELETE /api/orders/[id]` — soft delete order (admin required)
- **Intent Prefetching**: Order list rows trigger `fetchOne` on hover to hydrate detail page cache before navigation.

## User Profile Domain
The user profile system provides self-service account management for authenticated users, including addresses and notification preferences.

### Models (Prisma)
- **UserAddress** (`prisma/schema.prisma`): Stores shipping/billing addresses with `label` (Home/Work/Other), `name`, `phone`, full `address`, `city`, `state`, `pincode`, and `isDefault` flag. One-to-many per `clerkId`.
- **UserPreference** (`prisma/schema.prisma`): Stores notification settings (`notifyPush`, `notifyEmail`, `notifySms`, `notifyInApp`). One-to-one per `clerkId`.

### Service Layer
- **UserAddressService** (`src/services/user-address.service.ts`):
  - `getAddresses(clerkId)`, `getAddress(id, clerkId)`, `createAddress(...)`, `updateAddress(id, clerkId, data)`, `deleteAddress(id, clerkId)`, `setDefaultAddress(id, clerkId)`
  - Handles default address logic automatically: first address becomes default, setting a new default clears others, deletion promotes remaining default.
- **UserPreferenceService** (`src/services/user-preference.service.ts`):
  - `getPreferences(clerkId)`: Auto-creates default preferences if none exist.
  - `updatePreferences(clerkId, data)`: Upserts with selective boolean fields.

### API Layer
Routes under `/api/user/*` with Clerk authentication guard:

- **Addresses** (`src/app/api/user/addresses/route.ts`):
  - `GET /api/user/addresses` — returns list for authenticated user
  - `POST /api/user/addresses` — creates new address; emits `user/address.created.v1` event
- **Address Detail** (`src/app/api/user/addresses/[id]/route.ts`):
  - `PATCH /api/user/addresses/[id]` — updates address; emits `user/address.updated.v1`
  - `DELETE /api/user/addresses/[id]` — deletes address; emits `user/address.deleted.v1`
- **Set Default** (`src/app/api/user/addresses/[id]/default/route.ts`):
  - `PATCH /api/user/addresses/[id]/default` — marks address as default; part of address update flow
- **Preferences** (`src/app/api/user/preferences/route.ts`):
  - `GET /api/user/preferences` — returns current preferences
  - `PATCH /api/user/preferences` — updates fields; emits `user/preferences.updated.v1`

All routes validate input with `src/lib/validations/user-profile.ts` schemas (`addressSchema`, `updateAddressSchema`, `preferencesSchema`).

### Store Layer
- **useUserAddressStore** (`src/stores/user-address.store.ts`):
  - State: `addresses[]`, `isLoading`, `isAdding`, `updatingId`, `deletingId`, `settingDefaultId`
  - Actions: `fetchAddresses()`, `addAddress(data)`, `updateAddress(id, data)`, `deleteAddress(id)`, `setDefault(id)`
  - Implements optimistic updates with automatic rollback on failure and toast feedback.
- **useUserPreferenceStore** (`src/stores/user-preference.store.ts`):
  - State: `preferences` (single record), `isLoading`, `savingField`
  - Actions: `fetchPreferences()`, `updatePreference(field, value)`
  - Optimistic updates per-field with granular saving indicator.

### UI Components & Pages
Profile section under `(user)` group (customer-facing):

- **Profile Layout** (`src/app/(user)/profile/layout.tsx`): Wraps profile pages with consistent card container and mobile navigation header.
- **Profile Home** (`src/app/(user)/profile/page.tsx`): Dashboard with dark mode toggle, menu links to subpages, and logout button.
- **Subpages**:
  - `orders`: Order history (reads from existing order domain)
  - `coupons`: Available discounts
  - `addresses`: Address list with add/edit/delete/set-default using `AddressCard` and `AddressForm`
  - `notifications`: Preference toggles using `NotificationToggle` component
  - `legal`: Brand policy documents (read-only)
  - `support`: Help & contact information
- **Components** (`src/components/profile/`):
  - `ProfileHero`: User avatar and welcome message
  - `ProfileMenuItem`: Navigation item with icon and label
  - `AddressCard`: Displays address with edit/delete/default controls
  - `AddressForm`: Modal form for creating/editing addresses using `addressSchema`
  - `NotificationToggle`: Switch component for preference toggles

### Inngest Events
- `user/address.created.v1` — emitted after address creation
- `user/address.updated.v1` — emitted after address update
- `user/address.deleted.v1` — emitted after address deletion
- `user/preferences.updated.v1` — emitted after preference change

Functions (`src/inngest/functions/user-profile.ts`) perform audit logging and side effects (e.g., welcome emails, external service sync).

### UX Patterns
- **Optimistic UI**: Stores update immediately with placeholder IDs (crypto.randomUUID) for new addresses; revert on failure with toast.
- **Default Address Guarantee**: System ensures at least one default exists; promotions on deletion.
- **Granular Loading**: Buttons disable during add/update/delete/set-default operations; no global spinners.
- **Auto-creation**: Preferences record created on first fetch if missing.
- **Micro-interactions**: Instant toggle feedback, active scale effects, smooth transitions via `tw-animate-css`.

## UI Components
- **shadcn/ui**: Install via `bunx --bun shadcn@latest add <name>`. Components in `components/ui/`.
- **ThemeProvider**: Client component wrapper around `next-themes` `ThemeProvider` (`src/components/theme-provider.tsx`), configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`. Used at the root layout for global theme management.
- **BlurImage**: Optimized image component (`src/components/ui/blur-image.tsx`) that automatically loads low-quality blur placeholders (`-blurpic` suffix) before the main image. Uses backend-generated blur images for smooth visual transitions. Accepts all standard `next/image` props plus `useBlur` toggle (default: true).
- **Drawer**: `vaul`-based drawer component (`src/components/ui/drawer.tsx`) supports bottom/left/right/top directions with animated overlay.
- **Icon Library**: Uses `@hugeicons/core-free-icons` and `@hugeicons/react` for all iconography. Do not use `lucide-react`.
- **Chart**: Recharts-based chart wrapper (`src/components/ui/chart.tsx`) with theme-aware CSS variable injection. Exports `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`. Uses dynamic imports for SSR safety.

## Seed Data System (`prisma/seed.ts`)
- Tagged seed data with `SEED::ENTITIES` prefix for safe identification and cleanup.
- Creates: founders, brands, categories, products, variants, discounts, orders (100), carts (20).
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

### Session Claims Structure

Custom JWT claims configured in Clerk provide role and user profile data directly from the auth token:

```typescript
interface CustomJwtSessionClaims {
  metadata: {
    role?: "user" | "admin";
  };
  fullName: string;
  imageUrl: string;
  primaryEmailAddress: EmailAddress;
}
```

Access these via `sessionClaims` from `useAuth()` (client) or `auth()` (server). This avoids extra database calls for common user data. The `ProfileHero` component demonstrates client-side consumption using `session?.user` for the full profile, while `Topbar` demonstrates server-side role checks using `sessionClaims?.metadata?.role`.

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
  - `handleFileUpload` (`handle-file-upload`): Receives base64 file buffer. Executes steps:
    - `ensure-bucket-exists`: Creates bucket if missing (public: true)
    - `process-main-image`: For images, uses `sharp` to resize to 1920x1920 (maintains aspect, no enlargement), converts to WebP (quality 80). Non-images pass through unchanged.
    - `upload-main-to-supabase`: Uploads main image with 1-year cache control.
    - `process-blur-image` (images only): Creates 10x10 resized, blurred (radius 10), WebP (quality 20) placeholder.
    - `upload-blur-to-supabase`: Uploads blur with `-blurpic` suffix; errors logged non-fatally.
  - `handleFileDelete` (`handle-file-delete`): Removes files from storage. Extracts paths from public URLs and also deletes potential `-blurpic` counterparts. Step: `delete-from-supabase`.
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

### Blur Image System
The `BlurImage` component (`src/components/ui/blur-image.tsx`) provides optimized image loading with automatic blur placeholders:
- Automatically attempts to load `${src}-blurpic` as the initial blurred placeholder
- Main image fades in over the blur after loading
- Backend upload pipeline generates blur placeholders automatically via `sharp`
- Used throughout the UI to replace standard `next/image` for better perceived performance

## Analytics

The project uses **PostHog** for product analytics with automatic user identification and pageview tracking.

### Integration
- **Client Provider** (`src/components/providers/posthog-provider.tsx`):
  - Initializes PostHog with environment credentials (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`)
  - Uses `posthog-js` SDK with `PostHogProvider` wrapper
  - Configures `person_profiles: "identified_only"` for cost optimization
  - Manual pageview capture (App Router compatible) via `usePathname` and `useSearchParams`
  - Automatic user identification from Clerk session: `user.id`, `email`, `name`, `username`
  - Handles logout via `posthog.reset()`
- **Root Layout**: Wraps the entire app with `<PostHogProvider>` inside `<ThemeProvider>` to ensure all pages are tracked

### Environment Variables
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog instance host (default: `https://us.i.posthog.com`)

### Custom Events
Pageviews are captured automatically as `$pageview` with `$current_url` property. Custom events can be sent via `posthog.capture(eventName, properties)` from any client component.

## Error Handling
- Domain and persistence errors mapped through `src/lib/errors.ts`.
- API layer uses `handleError` to convert thrown errors into HTTP responses.
- Unknown errors are logged server-side and returned as `500 Internal Server Error`.
