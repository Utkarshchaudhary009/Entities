# Admin Dashboard — Build Plan

> **Workflow per section**: `git checkout -b feat/admin-<section>` → write code → `bun --bun biome check <file>` + `bun --bun tsc <file> --noEmit` on every new file → commit → PR → merge → move to next section.

---

## Layout Architecture (read before Phase 0)

```
src/app/layout.tsx  (root — wraps entire site)
  └── <SidebarProvider>         ← client context: { isOpen, toggle }
        ├── <Topbar />          ← SHARED across all pages
        │     ├── brand logo / nav links    (always)
        │     ├── 🍔 hamburger             (only rendered when sidebar context is "active")
        │     └── "Admin" button           (only visible when Clerk role === "admin")
        └── {children}
              ├── Public pages   → no sidebar, hamburger hidden automatically
              └── (admin) layout → activates sidebar context → hamburger appears
                    ├── <AdminSidebar />   ← slide-in panel (admin nav links)
                    └── {admin page content}
```

**Key insight:** `<Topbar>` calls `useSidebar()`. If a `SidebarProvider` ancestor has `enabled=true` (set by the admin layout), it shows the hamburger. Otherwise the slot is empty. No code duplication.

---

## Phase 0 — Foundation
- [ ] Branch: `feat/admin-foundation`

### Shared (lives in root layout, used site-wide)
- [ ] `src/contexts/sidebar-context.tsx` — `SidebarProvider` + `useSidebar()` hook; holds `{ isOpen, toggle, enabled }` state
- [ ] `src/components/layout/topbar.tsx` — site-wide topbar: logo, nav, 🍔 (conditional on `enabled`), "Admin" button (conditional on `role="admin"`), user avatar
- [ ] Update `src/app/layout.tsx` — wrap with `<SidebarProvider>`, add `<Topbar />`

### Admin-only
- [ ] `src/app/(admin)/layout.tsx` — Clerk `role="admin"` guard; calls `setSidebarEnabled(true)` on mount; renders `<AdminSidebar />` next to `{children}`
- [ ] `src/app/(admin)/page.tsx` — redirect to `/admin/dashboard`
- [ ] `src/components/admin/sidebar.tsx` — admin nav links, active state; reads `{ isOpen }` from `useSidebar()`
- [ ] `src/components/admin/data-table.tsx` — generic paginated table (columns, search, skeleton)
- [ ] `src/components/admin/stat-card.tsx` — KPI card (icon, title, value, delta badge)
- [ ] `src/components/admin/status-badge.tsx` — `OrderStatus` colored badge

- [ ] Lint & TSC all files
- [ ] PR → merge

---

## Phase 1 — Dashboard Overview
- [ ] Branch: `feat/admin-dashboard`
- [ ] `src/app/(admin)/dashboard/page.tsx`
  - KPI cards: total orders, revenue, pending orders, low-stock SKUs, active discounts
  - Recent orders mini-table (last 10)
  - Order status breakdown bar/donut
- [ ] Lint & TSC
- [ ] PR → merge

---

## Phase 2 — Orders
- [ ] Branch: `feat/admin-orders`
- [ ] `src/app/(admin)/orders/page.tsx` — filterable + paginated table; filter by `OrderStatus`, date range, search by order# / customer
- [ ] `src/app/(admin)/orders/[orderId]/page.tsx` — order detail: items, address block, status editor, admin notes textarea
- [ ] Lint & TSC
- [ ] PR → merge

---

## Phase 3 — Products & Variants
- [ ] Branch: `feat/admin-products`
- [ ] `src/app/(admin)/products/page.tsx` — table: thumbnail, name, category chip, price, active toggle
- [ ] `src/app/(admin)/products/new/page.tsx` — product creation form
- [ ] `src/app/(admin)/products/[productId]/page.tsx` — product edit form + variants sub-section (add / edit / delete variant inline)
- [ ] Lint & TSC
- [ ] PR → merge

---

## Phase 4 — Categories
- [ ] Branch: `feat/admin-categories`
- [ ] `src/app/(admin)/categories/page.tsx` — table: name, slug, discount %, active toggle, sort-order controls
- [ ] Create / edit drawer (thumbnail URL, about, discount %, sort order)
- [ ] Lint & TSC
- [ ] PR → merge

---

## Phase 5 — Discounts
- [ ] Branch: `feat/admin-discounts`
- [ ] `src/app/(admin)/discounts/page.tsx` — table: code, type (%, FIXED, BOGO), value, usage count / limit, active, expiry
- [ ] Create / edit drawer (all `Discount` fields, date pickers for `startsAt` / `expiresAt`)
- [ ] Lint & TSC
- [ ] PR → merge

---

## Phase 6 — Sizes & Colors
- [ ] Branch: `feat/admin-catalog-meta`
- [ ] `src/app/(admin)/sizes/page.tsx` — CRUD table: label, sort order, measurements JSON editor
- [ ] `src/app/(admin)/colors/page.tsx` — CRUD table: name, hex swatch picker, sort order
- [ ] Lint & TSC
- [ ] PR → merge

---

## Phase 7 — Brand & Founder
- [ ] Branch: `feat/admin-brand`
- [ ] `src/app/(admin)/brand/page.tsx`
  - Brand profile form (name, logo URL, tagline, brand story, support email/phone, active)
  - Philosophy section (mission, vision, values, story, hero image)
  - Social links list editor
- [ ] `src/app/(admin)/founder/page.tsx`
  - Founder form (name, age, story, education, quote, thumbnail)
  - Social links list editor
- [ ] Lint & TSC
- [ ] PR → merge

---

## Phase 8 — Brand Documents (Policies)
- [ ] Branch: `feat/admin-brand-documents`
- [ ] `src/app/(admin)/brand-documents/page.tsx`
  - Tab per `DocumentType`: RETURN_POLICY, SHIPPING_POLICY, REFUND_POLICY, PRIVACY_POLICY, TERMS_AND_CONDITIONS
  - Markdown / textarea editor + version display + active toggle
- [ ] Lint & TSC
- [ ] PR → merge

---

## General Rules (apply to every phase)
- Follow `DB → Service → API → Store → UI` architecture — UI never calls API directly
- Store-driven optimistic UI via Zustand; revert on failure with toast
- Granular loading states — no global spinners; use `<Skeleton>` per card/row
- Every file: `bun --bun biome check <filepath>` then `bun --bun tsc <filepath> --noEmit`
- No `npm` / `pnpm` — Bun only
- Clerk guard: `role === "admin"` (metadata `user_role`)
