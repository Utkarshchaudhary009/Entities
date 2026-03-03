# Shop Page Redesign - Master Plan

## Goal
Transform the default shop view (no search) to match the reference design with:
1. **New Arrivals** - Horizontal scrollable cards (thumbnail only, no price)
2. **Collections** - Horizontal scrollable oval/capsule category cards

When user searches → show current product grid.

---

## Feasibility Analysis

### ✅ Can Do with Current Infrastructure

| Requirement | Current Support | Notes |
|-------------|-----------------|-------|
| New Arrivals section | ✅ `Product.isFeatured` + `Product.createdAt` | Can query recent/featured products |
| Thumbnail-only cards | ✅ `Product.thumbnailUrl` exists | Just hide price in UI |
| Category images | ✅ `Category.thumbnailUrl` exists | Already in schema |
| Category filter on click | ✅ `setCategory(slug)` exists | Already implemented |
| Open drawer on click | ✅ `ProductDrawer` exists | Already implemented |
| Horizontal scroll | ✅ `ScrollArea` component | Already used for category pills |

### ⚠️ Needs Enhancement

| Requirement | Gap | Fix Required |
|-------------|-----|--------------|
| Product details in drawer | Missing: `description`, `material`, `fabric`, `fit`, `careInstruction` | Update `/api/shop/products/[id]` to include these fields |
| ProductDetails type | Missing fields | Update `shop.store.ts` types |
| ProductDrawer UI | No care guide section | Add collapsible details section |

---

## Schema Fields Available (Already in DB)

```prisma
model Product {
  description     String?
  material        String?
  fabric          String?
  fit             String?
  careInstruction String?   // ← Care guide
  isFeatured      Boolean   // ← For "New Arrivals"
  createdAt       DateTime  // ← For sorting by newest
}

model Category {
  thumbnailUrl    String?   // ← For collection cards
}
```

---

## Implementation Plan

### Phase 1: API Updates

#### 1.1 Update `/api/shop/products/[id]/route.ts`
Add missing product details to response:
```ts
select: {
  // ... existing fields
  description: true,
  material: true,
  fabric: true,
  fit: true,
  careInstruction: true,
}
```

#### 1.2 Update `shop.store.ts` types
```ts
export type ProductDetails = {
  // ... existing fields
  description: string | null;
  material: string | null;
  fabric: string | null;
  fit: string | null;
  careInstruction: string | null;
};
```

### Phase 2: New Arrivals Section

#### 2.1 Add to shop store (or inline fetch)
- Use existing catalog sorted by `createdAt DESC`
- Take first 10 products for New Arrivals section
- Catalog API already returns products; add `createdAt` to response for client-side sorting

#### 2.2 Create `NewArrivalsSection` component
- Horizontal `ScrollArea`
- Large rounded cards (no price)
- On click → open `ProductDrawer`
- **Shuffle** the 10 products on each render (use `useMemo` with empty deps or shuffle on mount)
- "See all" → `/shop?sort=newest`

### Phase 3: Collections Section

#### 3.1 Ensure category API returns `thumbnailUrl`
Check `/api/categories` returns this field (likely already does via `ApiCategory`).

#### 3.2 Create `CollectionsSection` component
- Horizontal `ScrollArea`
- Oval/capsule shaped image containers
- Category name below
- On click → `setCategory(slug)`

### Phase 4: Conditional Rendering

#### 4.1 Update `shop-content.tsx`
```tsx
const showDefaultView = !searchQuery.trim() && !categorySlug;

return (
  <div>
    {/* Header + Search (always visible) */}
    
    {showDefaultView ? (
      <>
        <NewArrivalsSection onProductClick={handleProductClick} />
        <CollectionsSection onCategoryClick={setCategory} />
      </>
    ) : (
      <>
        {/* Category pills */}
        {/* Product grid (existing) */}
      </>
    )}
    
    <ProductDrawer ... />
  </div>
);
```

### Phase 5: Product Drawer Enhancement

#### 5.1 Add details section to `product-drawer.tsx`
- Collapsible accordion or tabs
- Sections: Description, Material & Fabric, Fit, Care Instructions
- Only show sections that have content

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/api/shop/products/[id]/route.ts` | Modify | Add description, material, fabric, fit, careInstruction |
| `src/stores/shop.store.ts` | Modify | Update `ProductDetails` type |
| `src/app/(user)/shop/shop-content.tsx` | Modify | Conditional rendering, import new sections |
| `src/components/shop/new-arrivals-section.tsx` | Create | Horizontal scroll cards |
| `src/components/shop/collections-section.tsx` | Create | Oval category cards |
| `src/components/shop/product-drawer.tsx` | Modify | Add care guide / details section |
| `src/app/api/shop/catalog/route.ts` | Modify | Include `createdAt` field for sorting |
| `src/stores/shop.store.ts` | Modify | Add `createdAt` to `CatalogProduct` |

---

## Design Tokens (from reference)

- **New Arrival cards**: `rounded-3xl`, aspect ~3:4, large images
- **Collection cards**: Oval/capsule shape (`rounded-full` with tall aspect)
- **Typography**: Serif bold for section titles, "See all" link on right
- **Spacing**: Generous padding, tight card gaps

---

## Decisions

1. **New Arrivals**: Sort by `createdAt DESC`, take first 10, then **shuffle** for random display order each render
2. **"See all" links**:
   - New Arrivals → `/shop?sort=newest`
   - Collections → `/shop?category={slug}`

---

## Priority Order

1. ✅ Phase 1 (API) - Required for drawer details
2. ✅ Phase 5 (Drawer) - User can see full product info
3. ✅ Phase 2 (New Arrivals) - Core UI change
4. ✅ Phase 3 (Collections) - Core UI change
5. ✅ Phase 4 (Conditional render) - Wire it together
