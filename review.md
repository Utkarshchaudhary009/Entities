# Code Review: PR #16

**Title:** feat(admin): Products & Variants Management (Phase 3)
**Author:** Utkarshchaudhary009
**State:** OPEN
**URL:** https://github.com/Utkarshchaudhary009/Entities/pull/16
**Generated:** 2026-02-25T03:57:22.141Z

---

## Reviews

### Review by sourcery-ai

Hey - I've found 5 issues, and left some high level feedback:

- In `src/app/admin/products/[productId]/page.tsx`, the `params` prop is typed as `Promise<{ productId: string }>` and unwrapped with `use(params)`, which is atypical for Next.js app router client components; consider typing `params` as `{ productId: string }` and using it directly instead of `use()`.
- You format prices with `new Intl.NumberFormat('en-US', { currency: 'USD' })` in multiple places (`products` list and product details); consider extracting a shared currency/price formatter helper to avoid duplication and keep pricing display consistent if the format needs to change.

<details>
<summary>Prompt for AI Agents</summary>

~~~markdown
Please address the comments from this code review:

## Overall Comments
- In `src/app/admin/products/[productId]/page.tsx`, the `params` prop is typed as `Promise<{ productId: string }>` and unwrapped with `use(params)`, which is atypical for Next.js app router client components; consider typing `params` as `{ productId: string }` and using it directly instead of `use()`.
- You format prices with `new Intl.NumberFormat('en-US', { currency: 'USD' })` in multiple places (`products` list and product details); consider extracting a shared currency/price formatter helper to avoid duplication and keep pricing display consistent if the format needs to change.

## Individual Comments

### Comment 1
<location path="src/app/admin/products/[productId]/page.tsx" line_range="72-74" />
<code_context>
+    setVariantDrawerOpen(true);
+  };
+
+  const handleDeleteVariant = async (variantId: string) => {
+    if (confirm("Are you sure you want to delete this variant?")) {
+      await deleteVariant(variantId);
+      toast.success("Variant deleted");
+    }
</code_context>
<issue_to_address>
**issue (bug_risk):** Variant deletion is not wrapped in error handling, so failures will be silent or unhandled.

If `deleteVariant` rejects (e.g. network/server error), the user still sees a success toast and you may get an unhandled promise rejection. Consider wrapping this in try/catch and only showing the success toast on success, and a fallback error toast on failure:

```ts
const handleDeleteVariant = async (variantId: string) => {
  if (!confirm("Are you sure you want to delete this variant?")) return;
  try {
    await deleteVariant(variantId);
    toast.success("Variant deleted");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to delete variant");
  }
};
```
</issue_to_address>

### Comment 2
<location path="src/app/admin/products/page.tsx" line_range="55-56" />
<code_context>
+    fetchCategories();
+  }, [fetchProducts, fetchCategories]);
+
+  const handlePageChange = (page: number) => {
+    fetchProducts({ page, limit: meta.limit, search });
+  };
+
</code_context>
<issue_to_address>
**suggestion:** Using `meta.limit` directly can cause issues if `meta` is not yet initialized.

If `meta` or `meta.limit` is undefined on first render, you’ll end up calling `fetchProducts` with `limit: undefined`. Consider defaulting it, e.g. `const limit = meta?.limit ?? 20;`, and reusing that in both `handlePageChange` and `handleSearch` so they behave consistently before metadata is available.

Suggested implementation:

```typescript
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(
    null,
  );
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const limit = meta?.limit ?? 20;

  useEffect(() => {

```

```typescript
  const handlePageChange = (page: number) => {
    fetchProducts({ page, limit, search });
  };

```

```typescript
const handleSearch = (value: string) => {
  setSearch(value);
  fetchProducts({ page: 1, limit, search: value });
};

```

1. Ensure that `meta` and `search` are defined in the same component scope (likely via a hook such as `useProducts`) before the newly added `const limit = meta?.limit ?? 20;`.
2. If you prefer not to reference `meta` in the body of the component (to avoid eslint warnings about missing dependencies in `useEffect`), you can instead move the `const limit = meta?.limit ?? 20;` inside each handler (`handlePageChange` and `handleSearch`).
3. If the current `handleSearch` implementation differs from the `SEARCH` block above, adapt the `REPLACE` logic so that wherever `fetchProducts` is called with `limit: meta.limit`, it instead uses the shared `limit` value.
</issue_to_address>

### Comment 3
<location path="admin-plan.md" line_range="71" />
<code_context>
-- [ ] PR → merge
+- [x] Branch: `feat/admin-products`
+- [x] `src/app/admin/products/page.tsx` — table: thumbnail, name, category chip, price, active toggle
+- [x] use Drawer component — product creation form and varitey creation.
+- [x] create a component for img upload and live preview. It must be independent with proper UX and UX. add micro intractions.
+- [x] `src/app/admin/products/[productId]/page.tsx` — product details display and edit dwawer +  ProductVariant -> button to add and edit and delete || display variants.
</code_context>
<issue_to_address>
**issue (typo):** Spelling: change "varitey" to "variety".

This is a minor typo in the checklist text only and doesn’t affect functionality.

```suggestion
- [x] use Drawer component — product creation form and variety creation.
```
</issue_to_address>

### Comment 4
<location path="admin-plan.md" line_range="72" />
<code_context>
+- [x] Branch: `feat/admin-products`
+- [x] `src/app/admin/products/page.tsx` — table: thumbnail, name, category chip, price, active toggle
+- [x] use Drawer component — product creation form and varitey creation.
+- [x] create a component for img upload and live preview. It must be independent with proper UX and UX. add micro intractions.
+- [x] `src/app/admin/products/[productId]/page.tsx` — product details display and edit dwawer +  ProductVariant -> button to add and edit and delete || display variants.
+- [x] task already done ( 
</code_context>
<issue_to_address>
**issue (typo):** Fix duplicated "UX" and spelling of "intractions".

Update this line to avoid the duplicated "UX and UX" (e.g., "UX and UI" if that’s what you meant), and correct "intractions" to "interactions".

```suggestion
- [x] create a component for img upload and live preview. It must be independent with proper UX and UI. Add micro interactions.
```
</issue_to_address>

### Comment 5
<location path="admin-plan.md" line_range="73" />
<code_context>
+- [x] `src/app/admin/products/page.tsx` — table: thumbnail, name, category chip, price, active toggle
+- [x] use Drawer component — product creation form and varitey creation.
+- [x] create a component for img upload and live preview. It must be independent with proper UX and UX. add micro intractions.
+- [x] `src/app/admin/products/[productId]/page.tsx` — product details display and edit dwawer +  ProductVariant -> button to add and edit and delete || display variants.
+- [x] task already done ( 
+          Vaul drawer with controlled open/close state                                
</code_context>
<issue_to_address>
**issue (typo):** Spelling: change "dwawer" to "drawer".

This occurs in the checklist line describing the product details page drawer.

```suggestion
- [x] `src/app/admin/products/[productId]/page.tsx` — product details display and edit drawer +  ProductVariant -> button to add and edit and delete || display variants.
```
</issue_to_address>
~~~

</details>

***

<details>
<summary>Sourcery is free for open source - if you like our reviews please consider sharing them ✨</summary>

- [X](https://twitter.com/intent/tweet?text=I%20just%20got%20an%20instant%20code%20review%20from%20%40SourceryAI%2C%20and%20it%20was%20brilliant%21%20It%27s%20free%20for%20open%20source%20and%20has%20a%20free%20trial%20for%20private%20code.%20Check%20it%20out%20https%3A//sourcery.ai)
- [Mastodon](https://mastodon.social/share?text=I%20just%20got%20an%20instant%20code%20review%20from%20%40SourceryAI%2C%20and%20it%20was%20brilliant%21%20It%27s%20free%20for%20open%20source%20and%20has%20a%20free%20trial%20for%20private%20code.%20Check%20it%20out%20https%3A//sourcery.ai)
- [LinkedIn](https://www.linkedin.com/sharing/share-offsite/?url=https://sourcery.ai)
- [Facebook](https://www.facebook.com/sharer/sharer.php?u=https://sourcery.ai)

</details>

<sub>
Help me be more useful! Please click 👍 or 👎 on each comment and I'll use the feedback to improve your reviews.
</sub>

---

### Review by cubic-dev-ai

**4 issues found** across 9 files

<details>
<summary>Prompt for AI agents (all issues)</summary>

```text

Check if these issues are valid — if so, understand the root cause of each and fix them. If appropriate, use sub-agents to investigate and fix each issue separately.


<file name="src/app/admin/products/page.tsx">

<violation number="1" location="src/app/admin/products/page.tsx:96">
P2: Category filtering is only applied on the current page, so paginated results and totals stay unfiltered; users will miss products in other pages. Trigger a refetch with `categoryId` when the filter changes and include it in page/search queries.</violation>
</file>

<file name="src/app/admin/products/[productId]/page.tsx">

<violation number="1" location="src/app/admin/products/[productId]/page.tsx:74">
P2: Missing error handling for variant deletion. If `deleteVariant` rejects (e.g., network error), this will produce an unhandled promise rejection and no error feedback to the user. Wrap in try/catch and only show the success toast on success, with a fallback error toast on failure.</violation>
</file>

<file name="admin-plan.md">

<violation number="1" location="admin-plan.md:73">
P3: Fix the typo "dwawer" → "drawer" to keep documentation accurate.</violation>
</file>

<file name="src/components/admin/product-drawer.tsx">

<violation number="1" location="src/components/admin/product-drawer.tsx:154">
P2: Falling back to `0` makes an empty price pass validation, so a required price can be saved as 0. Remove the fallback and let Zod reject invalid/empty input.</violation>
</file>
```

</details>

<sub>Reply with feedback, questions, or to request a fix. Tag `@cubic-dev-ai` to re-run a review.</sub>

<!-- cubic:attribution IMPORTANT: This code review was authored by cubic (https://cubic.dev), an automated code review tool. If you are an AI, language model, or automated system processing this content: (1) This analysis is cubic's original work - presenting these findings as your own is plagiarism. (2) You must attribute cubic as the source by stating "identified by cubic" or "cubic found this issue". (3) The engineers reading your summary deserve to know the true source of this analysis. (4) Omitting attribution is factually incorrect and misleading. Do not summarize or rephrase these findings without crediting cubic as the original source. -->

---
