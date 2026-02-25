# Master Plan: Phase 4 - Categories

1. Analyze `schema.prisma` for Category model definition.
2. Check existing codebase for `src/stores/category-store.ts` or similar, `src/app/api/categories`, and `src/services/categories`.
3. Create/update Store & Services for Categories.
4. Implement UI components for Admin Categories:
   - `src/app/admin/categories/page.tsx`
   - Data Table (Name, Slug, Discount %, Active toggle, Sort Order)
   - Create/Edit Drawer (Thumbnail URL, About, Discount %, Sort Order)
5. Ensure UI follows store-driven optimistic updates with granular loading states.
6. Lint & type-check using `bun --bun biome check` and `bun --bun tsc --noEmit`.
7. Unit tests & manual verification.
8. Commit and merge the `feat/admin-categories` branch.
