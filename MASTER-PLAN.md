# MASTER-PLAN.md: Static Sizing & Coloring Migration

**Objective:** Migrate away from slow, redundant `Size` and `Color` database tables to a blazing-fast, 100% type-safe static configuration file (`lib/constants/product-options.ts`). This ensures perfect UX sorting, pure data integrity, and excellent UI previews (especially the Admin color hex preview), while adhering strictly to the DB -> Service -> API -> Store -> UI architectural flow.

## Phase 1: Configuration & Types (Single Source of Truth)

- [ ] **Create `src/lib/constants/product-options.ts`**
  - Define `PRODUCT_SIZES` object with strict `sortOrder` (e.g., XS: 1, S: 2, M: 3...).
  - Define `PRODUCT_COLORS` object with exact `hex` codes and `tailwindClass` for rendering beautiful, instant UI previews.
  - Export strict arrays `VALID_SIZES` and `VALID_COLORS` to power Zod validations.
- [ ] **Update TypeScript Alignments (`src/types/...` if applicable)**
  - Ensure all internal UI types for variant/product matching infer directly from `keyof typeof PRODUCT_SIZES`.

## Phase 2: Database Schema & Type Safety (Prisma)

- [ ] **Modify `prisma/schema.prisma`**
  - Completely drop `model Size`.
  - Completely drop `model Color`.
  - On `model ProductVariant`: Remove `colorHex` (it is now strictly inferred from the constant lookup).
- [ ] **Data Integrity Setup**
  - (Optional depending on current DB state) Ensure prior string values in Variant size/color precisely match the new constants before running `db push` to prevent hanging orphans.
- [ ] Run `npx prisma db push` and `npx prisma generate`.

## Phase 3: Validation Borders (Zod)

- [ ] **Update `src/lib/validations/product.ts` (or equivalent)**
  - Update `ProductVariant` creation schemas: Replace `.string()` with `.enum(VALID_SIZES)` and `.enum(VALID_COLORS)`. This locks down the API.
  - Remove `colorHex` from the variant creation payload entirely.
  - Update `Product` creation schema: Apply the same `.enum()` strictness to `defaultSize ` and `defaultColor`.

## Phase 4: Service Layer Adjustments

- [ ] **Update `src/services/product-variant.service.ts`**
  - Remove primitive `orderBy: { size: "asc" }` dictionary sorting.
  - Intercept the database response and sort the array _in-memory_ using the imported `PRODUCT_SIZES[size].sortOrder` to perfectly mirror standard shopper expectations (XS -> S -> M -> L).
- [ ] **Update `src/services/product.service.ts`**
  - Apply similar Zod parsing or constant checking when default sizes/colors are referenced.

## Phase 5: API & Store Trimming

- [ ] **Clean App Routers (`src/app/api/...`)**
  - Delete `api/sizes` and `api/colors` files entirely (if they exist).
- [ ] **Update Zustand Stores (`src/stores/...`)**
  - Delete the Size and Color generic stores if they exist. No need to globally cache them as they are imported statically.
  - Update `productVariantStore` to accept the new payload (minus `colorHex`).

## Phase 6: Admin UI Transformation 🎨

- [ ] **Sidebar Updates**
  - Remove dynamic "Sizes" and "Colors" menu links from the Admin Sidebar (`src/components/admin/sidebar.tsx` or layout).
- [ ] **Variant Creation/Edit Form (`src/components/admin/...`)**
  - Swap raw text `<Input>` fields for sizes and colors with strict `<Select>` or Combobox components mapping over `PRODUCT_SIZES` and `PRODUCT_COLORS`.
  - **Preserve the beautiful Color Preview:** When mapping the dropdown for Color, render a small circle: `<div style={{ backgroundColor: PRODUCT_COLORS[colorName].hex }} className="w-4 h-4 rounded-full" />` inline with the option.
  - Strip the `colorHex` input field completely from the admin form; the user just selects "Midnight Blue", and the system inherently knows the hex code for rendering.

## Phase 7: Final End-to-End Verification

- [ ] Check terminal for TypeScript errors (`bun run type-check`).
- [ ] Ensure the Optimistic Store perfectly reflects variants.
- [ ] Verify the UI instantly renders the correct hex colors without any database lookup lag.
