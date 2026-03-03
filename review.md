# Code Review: PR #25

**Title:** fix: resolve biome lint and typescript errors
**Author:** Utkarshchaudhary009
**State:** OPEN
**URL:** https://github.com/Utkarshchaudhary009/Entities/pull/25
**Generated:** 2026-03-03T05:38:41.354Z

---

## Reviews

### Review by sourcery-ai

Hey - I've found 4 issues, and left some high level feedback:

- In `CollectionsSection`, the "See all" handler uses a global `document.querySelector('[data-slot="scroll-area-viewport"]')`, which will target only the first scroll area on the page; consider scoping this via a `ref` to the local `ScrollArea` so the button reliably scrolls the correct list.
- The test changes that cast mocks like `fetchApi as ReturnType<typeof fetchApi>` are misleading, since `ReturnType` refers to the mock’s return value rather than the mock function itself; using `typeof fetchApi` or the concrete mock type would better express the intent and avoid type confusion.

<details>
<summary>Prompt for AI Agents</summary>

~~~markdown
Please address the comments from this code review:

## Overall Comments
- In `CollectionsSection`, the "See all" handler uses a global `document.querySelector('[data-slot="scroll-area-viewport"]')`, which will target only the first scroll area on the page; consider scoping this via a `ref` to the local `ScrollArea` so the button reliably scrolls the correct list.
- The test changes that cast mocks like `fetchApi as ReturnType<typeof fetchApi>` are misleading, since `ReturnType` refers to the mock’s return value rather than the mock function itself; using `typeof fetchApi` or the concrete mock type would better express the intent and avoid type confusion.

## Individual Comments

### Comment 1
<location path="src/components/shop/collections-section.tsx" line_range="30-37" />
<code_context>
-          ) : (
-            <ScrollArea className="w-full whitespace-nowrap">
-              <div className="flex w-max gap-2">
-                <button
-                  type="button"
-                  onClick={() => setCategory(null)}
</code_context>
<issue_to_address>
**issue (bug_risk):** Using a global querySelector for the scroll viewport may target the wrong ScrollArea when multiple are present.

`document.querySelector('[data-slot="scroll-area-viewport"]')` will always pick the first matching viewport, so on pages with multiple `ScrollArea`s (like your shop page) this can scroll the wrong section.

Instead, attach a `ref` to this component’s `ScrollArea` and query the viewport within `ref.current` (optionally using a dedicated `data-*` attribute). This scopes the behavior to this instance and prevents cross-component interference.
</issue_to_address>

### Comment 2
<location path="src/components/shop/new-arrivals-section.tsx" line_range="41-43" />
<code_context>
+  return (
+    <section className="py-6">
+      <div className="mb-4 flex items-center justify-between">
+        <h2 className="font-serif text-xl font-bold tracking-tight">
+          Collections
+        </h2>
</code_context>
<issue_to_address>
**nitpick (typo):** Heading text "New Arrival" may be misleading when multiple products are shown.

Since this section can display up to 10 items, consider using a plural label (e.g., “New Arrivals”) or another collection-focused title to better match the multi-item carousel.

```suggestion
        <h2 className="font-serif text-xl font-bold tracking-tight">
          New Arrivals
        </h2>
```
</issue_to_address>

### Comment 3
<location path="tests/unit/stores/product.store.test.ts" line_range="29" />
<code_context>
     });
-    (fetchApi as any).mockReset();
-    (fetchJson as any).mockReset();
+    (fetchApi as ReturnType<typeof fetchApi>).mockReset();
+    (fetchJson as ReturnType<typeof fetchJson>).mockReset();
   });
</code_context>
<issue_to_address>
**issue (testing):** The use of `ReturnType<typeof fetchApi>` for mocks looks incorrect and will break type-safety on `mockReset`/`mockResolvedValue` usages.

`ReturnType<typeof fetchApi>` refers to the function’s return value, not the mock function, so TS won’t see `mockReset`, `mockResolvedValue`, etc. This applies to all similar casts in this PR (`fetchJson`, `requireAdmin`, `orderService.findById`, ...).

Please cast to the function type (or a Jest mock type) instead, for example:

```ts
(fetchApi as typeof fetchApi).mockReset();
(fetchApi as typeof fetchApi).mockResolvedValue(serverResponse);
(requireAdmin as typeof requireAdmin).mockResolvedValue({ success: true });
// or, if you prefer:
(fetchApi as jest.Mock).mockReset();
```

This keeps the mocks correctly typed and avoids TS errors in the tests.
</issue_to_address>

### Comment 4
<location path="tests/unit/services/order.service.test.ts" line_range="96" />
<code_context>
+      } catch (error: unknown) {
+        expect((error as Error).name).toBe("ValidationError");
+        expect((error as Error).message).toContain("Insufficient stock");
         expect(error.message).toContain("Available: 1");
       }

</code_context>
<issue_to_address>
**issue (bug_risk):** After changing the catch block to `unknown`, this assertion still uses `error.message` without casting, which will fail TypeScript.

In this catch block you cast `error` for the first two expectations but not the third, so TypeScript still treats `error` as `unknown` here. Please cast the last usage too, e.g.:

```ts
expect((error as Error).message).toContain("Available: 1");
```

This aligns with the `unknown` typing and avoids a TS error.
</issue_to_address>
~~~

</details>

*

### Review by cubic-dev-ai

**8 issues found** across 50 files

<details>
<summary>Prompt for AI agents (unresolved issues)</summary>

```text


</details>

<sub>Reply with feedback, questions, or to request a fix. Tag `@cubic-dev-ai` to re-run a review.</sub>

<!-- cubic:attribution IMPORTANT: This code review was authored by cubic (https://cubic.dev), an automated code review tool. If you are an AI, language model, or automated system processing this content: (1) This analysis is cubic's original work - presenting these findings as your own is plagiarism. (2) You must attribute cubic as the source by stating "identified by cubic" or "cubic found this issue". (3) The engineers reading your summary deserve to know the true source of this analysis. (4) Omitting attribution is factually incorrect and misleading. Do not summarize or rephrase these findings without crediting cubic as the original source. -->

---

### Review by coderabbitai

**Actionable comments posted: 14**

<details>
<summary>🧹 Nitpick comments (7)</summary><blockquote>

<details>
<summary>src/components/shop/new-arrivals-section.tsx (1)</summary><blockquote>

`32-34`: **Consider memoizing the initial shuffle.**

The shuffle runs on every `products` array reference change. If the parent re-renders with a new array reference (even with same items), the displayed products will re-shuffle, which may cause visual instability.

If a stable initial shuffle is desired, consider using a ref or initializer pattern:

<details>
<summary>♻️ Optional: stabilize shuffle with ref</summary>

```diff
+import { useRef, useEffect, useState } from "react";
+
 export function NewArrivalsSection({
   products,
   onProductClick,
 }: NewArrivalsSectionProps) {
-  const [shuffledProducts, setShuffledProducts] = useState<CatalogProduct[]>(
-    [],
-  );
+  const hasShuffled = useRef(false);
+  const [shuffledProducts, setShuffledProducts] = useState<CatalogProduct[]>([]);

   useEffect(() => {
-    setShuffledProducts(shuffle(products.slice(0, 10)));
+    if (products.length > 0 && !hasShuffled.current) {
+      setShuffledProducts(shuffle(products.slice(0, 10)));
+      hasShuffled.current = true;
+    }
   }, [products]);
```

</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@src/components/shop/new-arrivals-section.tsx` around lines 32 - 34, The
current useEffect calls setShuffledProducts(shuffle(products.slice(0, 10))) on
every products reference change, causing unnecessary re-shuffles; change this to
compute the initial shuffle only once per meaningful change by using a ref or a
state initializer: e.g., useRef to store the shuffled array (compute
shuffle(products.slice(0,10)) only when you detect items actually changed) or
use useState(() => shuffle(products.slice(0,10))) and update it only when
product contents change (deep-compare or derive a stable key), updating
references in the component where setShuffledProducts, shuffle, and products are
used.
```

</details>

</blockquote></details>
<details>
<summary>tests/unit/api/generic.routes.test.ts (1)</summary><blockquote>

`75-98`: **Redundant mock setup detected.**

`service.create.mockResolvedValue` is called twice (lines 79-82 and 95-98). The second call overwrites the first, making the initial setup at lines 79-82 unnecessary.


<details>
<summary>♻️ Proposed fix to remove redundant mock setup</summary>

```diff
       (requireAdmin as ReturnType<typeof mock>).mockResolvedValue({
         success: true,
         auth: { userId: "admin" },
       });
-      (service.create as ReturnType<typeof mock>).mockResolvedValue({
-        id: "1",
-        ...validBody,
-      });

       // Map back to DB structure for mock return
       const dbEntity = { ...validBody };
```
</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@tests/unit/api/generic.routes.test.ts` around lines 75 - 98, Remove the
duplicate mockResolvedValue for service.create so only the intended DB-mapped
response remains: keep the mock that returns { id: "1", ...dbEntity } and delete
the earlier service.create.mockResolvedValue({ id: "1", ...validBody }) call;
ensure there is a single service.create mock in this test (references:
service.create, dbEntity, validBody, requireAdmin).
```

</details>

</blockquote></details>
<details>
<summary>tests/unit/services/brand.service.test.ts (1)</summary><blockquote>

`78-89`: **Test may pass silently if no error is thrown.**

The `try/catch` pattern without a fail assertion means this test will pass even if `findById` doesn't throw. Consider adding `expect.assertions(2)` or using `expect(...).rejects.toThrow()`.


<details>
<summary>♻️ Suggested refactor using rejects pattern</summary>

```diff
     it("should throw NotFoundError when brand not found", async () => {
       // ARRANGE
       mockPrisma.brand.findUnique.mockResolvedValue(null);

-      // ACT & ASSERT
-      try {
-        await brandService.findById("999");
-      } catch (error: unknown) {
-        expect((error as Error).name).toBe("NotFoundError");
-        expect((error as Error).message).toContain("Brand");
-      }
+      // ACT & ASSERT
+      await expect(brandService.findById("999")).rejects.toThrow("Brand");
     });
```
</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@tests/unit/services/brand.service.test.ts` around lines 78 - 89, The test
uses a try/catch so it can pass silently if no error is thrown; update the test
for brandService.findById to assert the rejection deterministically by either
adding expect.assertions(2) at the top of the test or converting the ACT/ASSERT
to Jest's rejects pattern (e.g., await
expect(brandService.findById("999")).rejects.toThrow() and/or
.rejects.toHaveProperty('name','NotFoundError') ), and keep the mock reference
mockPrisma.brand.findUnique.mockResolvedValue(null) unchanged.
```

</details>

</blockquote></details>
<details>
<summary>tests/unit/services/discount.service.test.ts (1)</summary><blockquote>

`64-75`: **Test may pass silently if no error is thrown.**

Same pattern issue as other service tests. The `try/catch` without a forced failure allows silent passes.


<details>
<summary>♻️ Suggested refactor</summary>

```diff
     it("should throw NotFoundError when discount not found", async () => {
       // ARRANGE
       mockPrisma.discount.findUnique.mockResolvedValue(null);

-      // ACT & ASSERT
-      try {
-        await discountService.findById("999");
-      } catch (error: unknown) {
-        expect((error as Error).name).toBe("NotFoundError");
-        expect((error as Error).message).toContain("Discount");
-      }
+      // ACT & ASSERT
+      await expect(discountService.findById("999")).rejects.toThrow("Discount");
     });
```
</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@tests/unit/services/discount.service.test.ts` around lines 64 - 75, The test
for discountService.findById("999") can pass silently because the try/catch
doesn’t fail the test when no error is thrown; update the test to explicitly
assert rejection instead of swallowing success—either replace the try/catch with
await expect(discountService.findById("999")).rejects.toThrow(/Discount/) (or
.rejects.toHaveProperty('name','NotFoundError')), or keep the try block but add
a fail() (or throw new Error) immediately after the await to ensure the test
fails if findById does not throw; reference discountService.findById and the
test case name when making the change.
```

</details>

</blockquote></details>
<details>
<summary>tests/unit/services/category.service.test.ts (1)</summary><blockquote>

`64-75`: **Test may pass silently if no error is thrown.**

Same pattern issue as other service tests. Consider using `expect(...).rejects.toThrow()` or adding `expect.assertions(2)` at the start of the test.


<details>
<summary>♻️ Suggested refactor</summary>

```diff
     it("should throw NotFoundError when category not found", async () => {
       // ARRANGE
       mockPrisma.category.findUnique.mockResolvedValue(null);

-      // ACT & ASSERT
-      try {
-        await categoryService.findById("999");
-      } catch (error: unknown) {
-        expect((error as Error).name).toBe("NotFoundError");
-        expect((error as Error).message).toContain("Category");
-      }
+      // ACT & ASSERT
+      await expect(categoryService.findById("999")).rejects.toThrow("Category");
     });
```
</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@tests/unit/services/category.service.test.ts` around lines 64 - 75, The test
for categoryService.findById can pass silently if no error is thrown because the
catch block may never run; update the test to assert the promise rejects (e.g.,
use await expect(categoryService.findById("999")).rejects.toThrow() or add
expect.assertions(2) at the start) and keep the
mockPrisma.category.findUnique.mockResolvedValue(null) arrangement; reference
the mock call mockPrisma.category.findUnique and the method
categoryService.findById when making the change so the test fails if no
NotFoundError is thrown.
```

</details>

</blockquote></details>
<details>
<summary>tests/unit/services/brand-document.service.test.ts (1)</summary><blockquote>

`72-82`: **Test may pass silently if no error is thrown.**

Same issue as in other service tests—if `findById` doesn't throw, the test passes without any assertions. Consider using `expect(...).rejects.toThrow()` or adding `expect.assertions(1)`.


<details>
<summary>♻️ Suggested refactor</summary>

```diff
     it("should throw NotFoundError when document not found", async () => {
       // ARRANGE
       mockPrisma.brandDocument.findUnique.mockResolvedValue(null);

-      // ACT & ASSERT
-      try {
-        await brandDocumentService.findById("999");
-      } catch (error: unknown) {
-        expect((error as Error).name).toBe("NotFoundError");
-      }
+      // ACT & ASSERT
+      await expect(brandDocumentService.findById("999")).rejects.toMatchObject({
+        name: "NotFoundError",
+      });
     });
```
</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@tests/unit/services/brand-document.service.test.ts` around lines 72 - 82, The
test currently swallows a missing-throw case because it uses try/catch without
asserting the catch path; update the test for brandDocumentService.findById to
assert a rejection instead (e.g. use await
expect(brandDocumentService.findById("999")).rejects.toThrow() or await
expect(...).rejects.toMatchObject({ name: "NotFoundError" })), or add
expect.assertions(1) at the start of the test to ensure the catch block runs;
reference the existing test for brandDocumentService.findById to make the
change.
```

</details>

</blockquote></details>
<details>
<summary>tests/unit/api/orders.route.test.ts (1)</summary><blockquote>

`46-50`: **Reset all used service mocks in `beforeEach`**

`orderService.findByIdWithOwnership` is exercised in this suite (Line 60-61) but not reset in setup. Add its reset to keep tests fully isolated as this file grows.

<details>
<summary>♻️ Suggested adjustment</summary>

```diff
   beforeEach(() => {
     (requireAuth as ReturnType<typeof mock>).mockReset();
     (requireAdmin as ReturnType<typeof mock>).mockReset();
     (orderService.findById as ReturnType<typeof mock>).mockReset();
+    (orderService.findByIdWithOwnership as ReturnType<typeof mock>).mockReset();
     (orderService.updateOrderDetails as ReturnType<typeof mock>).mockReset();
   });
```
</details>

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@tests/unit/api/orders.route.test.ts` around lines 46 - 50, The test setup in
the beforeEach misses resetting orderService.findByIdWithOwnership which is used
later; update the beforeEach reset block to call
(orderService.findByIdWithOwnership as ReturnType<typeof mock>).mockReset()
alongside the existing resets (requireAuth, requireAdmin, orderService.findById,
orderService.updateOrderDetails) so mocks are fully isolated between tests.
```

</details>

</blockquote></details>

</blockquote></details>

<details>
<summary>🤖 Prompt for all review comments with AI agents</summary>

```

Check if these issues are valid — if so, understand the root cause of each and fix them. If appropriate, use sub-agents to investigate and fix each issue separately.


<file name="tests/unit/services/social-link.service.test.ts">

<violation number="1" location="tests/unit/services/social-link.service.test.ts:70">
P2: This test can pass even when no error is thrown, because assertions only run inside `catch`. Add an explicit failure/assertion for the non-throwing path.</violation>
</file>

<file name="src/app/api/discounts/route.ts">

<violation number="1" location="src/app/api/discounts/route.ts:23">
P1: Avoid `cached.static` on this admin-authenticated route; it applies public CDN caching and can leak or serve stale admin data. Use a non-shared cache policy (`noStore`, or at minimum `private`) for this response.</violation>
</file>

<file name="src/components/shop/collections-section.tsx">

<violation number="1" location="src/components/shop/collections-section.tsx:33">
P2: The `See all` handler targets the first scroll viewport in the document, so it can scroll the wrong list when multiple scroll areas are rendered.</violation>
</file>

<file name="src/app/api/products/route.ts">

<violation number="1" location="src/app/api/products/route.ts:28">
P1: Do not use shared public static caching for this auth-dependent product list; it can leak admin-only inactive products to non-admin users.</violation>
</file>

<file name="src/app/api/founders/route.ts">

<violation number="1" location="src/app/api/founders/route.ts:19">
P2: Using `cached.static` here significantly increases cache staleness for a mutable founders list, which can delay newly created founder data from appearing.</violation>
</file>

<file name="src/app/(user)/profile/addresses/page.tsx">

<violation number="1" location="src/app/(user)/profile/addresses/page.tsx:55">
P1: Forcing `isDefault` to `false` on submit breaks the first-address default behavior by overriding store fallback logic.</violation>
</file>

<file name="src/app/(user)/shop/shop-content.tsx">

<violation number="1" location="src/app/(user)/shop/shop-content.tsx:62">
P2: The new `sort` query param is used to change layout but not to sort products, so `/shop?sort=newest` shows unsorted results.</violation>
</file>

<file name="src/app/api/brand-documents/route.ts">

<violation number="1" location="src/app/api/brand-documents/route.ts:23">
P2: This change unintentionally increases cache lifetime for brand documents, likely causing stale data to be served far longer than before.</violation>


In `@src/app/`(user)/profile/addresses/page.tsx:
- Around line 54-63: The current handleSubmit function unconditionally
normalizes isDefault to false which causes updateAddress(editingAddressId,
payload) to unintentionally clear defaults on edits; change handleSubmit so that
when editingAddressId is present you do not coerce or add isDefault if
data.isDefault is undefined (i.e. pass data as-is or omit isDefault), but when
creating (no editingAddressId) set isDefault: data.isDefault ?? false so
addAddress receives a definitive boolean; adjust the payload construction and
branches around updateAddress and addAddress accordingly.

In `@src/app/api/categories/route.ts`:
- Around line 52-55: In the POST handler (exported POST function) you are
calling revalidatePath("/api/categories") and
revalidatePath("/api/shop/catalog") twice; remove the duplicate calls so each
path is revalidated only once—keep a single revalidatePath("/api/categories")
and a single revalidatePath("/api/shop/catalog") in the POST flow to avoid
redundant invalidations while leaving the revalidatePath calls and POST function
intact.

In `@src/components/shop/collections-section.tsx`:
- Around line 30-33: The clickable buttons in the CollectionsSection component
(the "See all" button and the category buttons rendered around lines where the
button JSX appears) lack the required pressed-state micro-interaction; update
each button's className to include the active:scale-95 utility (e.g., append
"active:scale-95" to the existing "text-sm text-muted-foreground
transition-colors hover:text-foreground" string) so presses show immediate
visual feedback, and ensure this change is applied to both the "See all" button
and the category button elements inside the component (the JSX button elements
rendering categories around the 50-55 area).
- Around line 33-40: The onClick handler in CollectionsSection currently uses
document.querySelector('[data-slot="scroll-area-viewport"]') which can target
the wrong viewport when multiple sections render; add a React ref (e.g.,
sectionRef via useRef<HTMLElement | null>) on the section wrapper in the
CollectionsSection component and replace the global query with scopedQuery =
sectionRef.current?.querySelector('[data-slot="scroll-area-viewport"]'); then
call scopedQuery?.scrollTo({ left: scopedQuery.scrollWidth, behavior: 'smooth'
}) so the "See all" button scrolls the correct section instance.

In `@tests/unit/inngest/upload.functions.test.ts`:
- Around line 59-60: Remove the biome-ignore and the `as any` casts when
invoking the Inngest handlers; instead define the internal handler signature and
use it for typed calls: create a local type or interface matching the internal
`fn` shape (e.g., type InngestHandlerFn = { fn: (args: { event: Event; step?:
Step }) => Promise<any> } or similar) and cast `handleFileUpload` and
`handleFileDelete` to that explicit type before calling `.fn({ event, step:
mockStep })`; update both invocations (the `handleFileUpload.fn` and
`handleFileDelete.fn` calls) to use the new explicit type so lint rules and
noExplicitAny are satisfied and remove the biome-ignore comments.

In `@tests/unit/services/order.service.test.ts`:
- Around line 93-97: The catch block uses an unknown-typed variable `error` but
accesses `error.message` directly; change this to safely narrow the type before
accessing message (e.g., perform an instanceof Error check or create a typed
alias like `const err = error as Error` and then use `err.message`) so all three
expectations consistently cast/guard (matching the existing pattern at lines
94–95) in the test in tests/unit/services/order.service.test.ts.

In `@tests/unit/services/social-link.service.test.ts`:
- Around line 68-72: The current try/catch can false-pass if no error is thrown;
replace it with an explicit rejection assertion: remove the try/catch around
socialLinkService.findById("999") and use await
expect(socialLinkService.findById("999")).rejects to assert the promise rejects,
then assert the error identity (e.g., .rejects.toThrow() or
.rejects.toMatchObject({ name: "NotFoundError" })) so the test fails when no
error is thrown. Ensure you reference the same call to
socialLinkService.findById("999") and assert the NotFoundError name.
- Around line 88-89: Remove the biome-ignore comment and the "as any" cast in
the test; instead construct a properly typed test input that matches the
SocialLinkCreate DTO/interface expected by socialLinkService.create (use the
same type used by the service method or import the CreateSocialLink type) and
pass that typed value to socialLinkService.create; update the test's "input"
variable declaration to explicitly use that type and valid fields so no lint
suppression or any-casting is needed.

In `@tests/unit/stores/brand.store.test.ts`:
- Around line 23-24: The tests are casting fetchApi and fetchJson to the wrong
types before calling mock methods; update all casts that currently use
ReturnType<typeof fetchApi> or ReturnType<typeof fetchJson> to use
ReturnType<typeof mock> so the mockReset(), mockResolvedValue(), and
mockRejectedValue() calls are invoked on the Bun mock type (e.g., change casts
surrounding fetchApi and fetchJson where
mockReset/mockResolvedValue/mockRejectedValue are used to ReturnType<typeof
mock>); apply the same change to every occurrence (including the other ranges
mentioned) so TypeScript recognizes the mock methods on fetchApi and fetchJson.

In `@tests/unit/stores/cart.store.test.ts`:
- Line 22: The tests currently cast fetchApi to ReturnType<typeof fetchApi>
before calling mock methods (.mockReset, .mockResolvedValue,
.mockRejectedValue), but that type is the Promise-return type rather than the
mock function type; update all such casts (for fetchApi usages at the noted
spots including the occurrences around lines with .mockReset,
.mockResolvedValue, .mockRejectedValue) to use ReturnType<typeof mock> so the
TypeScript type reflects the bun:test mock function and allows mock methods on
fetchApi; ensure each call site (where fetchApi is cast before calling
mockReset/mockResolvedValue/mockRejectedValue) is changed to the new cast and
that imports still include mock from "bun:test".

In `@tests/unit/stores/category.store.test.ts`:
- Line 27: The test is casting the fetchApi mock to ReturnType<typeof fetchApi>
which resolves to the async function's Promise type and lacks jest mock methods;
change the casts to use ReturnType<typeof mock> wherever you call (fetchApi as
ReturnType<typeof fetchApi>) and similar casts around fetchApi.mockReset(),
fetchApi.mockResolvedValue(), etc. Specifically update the mock casts used with
fetchApi in the test (including the other occurrences noted) to (fetchApi as
ReturnType<typeof mock>) so the mockReset() and mockResolvedValue() calls are
available and consistent with other tests.

In `@tests/unit/stores/product.store.test.ts`:
- Around line 29-30: The tests incorrectly cast the mocked functions using
ReturnType<typeof fetchApi> and ReturnType<typeof fetchJson>, which resolve to
Promise types that lack mock methods; update those casts to ReturnType<typeof
mock> where fetchApi and fetchJson are being used (the lines with (fetchApi as
...).mockReset() / mockResolvedValue and similarly for fetchJson), matching the
pattern used in upload.route.test.ts; also apply the same change to the other
occurrences mentioned (lines 38-40 and 64-66) so the mocks expose mockReset,
mockResolvedValue, etc.

---

Nitpick comments:
In `@src/components/shop/new-arrivals-section.tsx`:
- Around line 32-34: The current useEffect calls
setShuffledProducts(shuffle(products.slice(0, 10))) on every products reference
change, causing unnecessary re-shuffles; change this to compute the initial
shuffle only once per meaningful change by using a ref or a state initializer:
e.g., useRef to store the shuffled array (compute shuffle(products.slice(0,10))
only when you detect items actually changed) or use useState(() =>
shuffle(products.slice(0,10))) and update it only when product contents change
(deep-compare or derive a stable key), updating references in the component
where setShuffledProducts, shuffle, and products are used.

In `@tests/unit/api/generic.routes.test.ts`:
- Around line 75-98: Remove the duplicate mockResolvedValue for service.create
so only the intended DB-mapped response remains: keep the mock that returns {
id: "1", ...dbEntity } and delete the earlier service.create.mockResolvedValue({
id: "1", ...validBody }) call; ensure there is a single service.create mock in
this test (references: service.create, dbEntity, validBody, requireAdmin).

In `@tests/unit/api/orders.route.test.ts`:
- Around line 46-50: The test setup in the beforeEach misses resetting
orderService.findByIdWithOwnership which is used later; update the beforeEach
reset block to call (orderService.findByIdWithOwnership as ReturnType<typeof
mock>).mockReset() alongside the existing resets (requireAuth, requireAdmin,
orderService.findById, orderService.updateOrderDetails) so mocks are fully
isolated between tests.

In `@tests/unit/services/brand-document.service.test.ts`:
- Around line 72-82: The test currently swallows a missing-throw case because it
uses try/catch without asserting the catch path; update the test for
brandDocumentService.findById to assert a rejection instead (e.g. use await
expect(brandDocumentService.findById("999")).rejects.toThrow() or await
expect(...).rejects.toMatchObject({ name: "NotFoundError" })), or add
expect.assertions(1) at the start of the test to ensure the catch block runs;
reference the existing test for brandDocumentService.findById to make the
change.

In `@tests/unit/services/brand.service.test.ts`:
- Around line 78-89: The test uses a try/catch so it can pass silently if no
error is thrown; update the test for brandService.findById to assert the
rejection deterministically by either adding expect.assertions(2) at the top of
the test or converting the ACT/ASSERT to Jest's rejects pattern (e.g., await
expect(brandService.findById("999")).rejects.toThrow() and/or
.rejects.toHaveProperty('name','NotFoundError') ), and keep the mock reference
mockPrisma.brand.findUnique.mockResolvedValue(null) unchanged.

In `@tests/unit/services/category.service.test.ts`:
- Around line 64-75: The test for categoryService.findById can pass silently if
no error is thrown because the catch block may never run; update the test to
assert the promise rejects (e.g., use await
expect(categoryService.findById("999")).rejects.toThrow() or add
expect.assertions(2) at the start) and keep the
mockPrisma.category.findUnique.mockResolvedValue(null) arrangement; reference
the mock call mockPrisma.category.findUnique and the method
categoryService.findById when making the change so the test fails if no
NotFoundError is thrown.

In `@tests/unit/services/discount.service.test.ts`:
- Around line 64-75: The test for discountService.findById("999") can pass
silently because the try/catch doesn’t fail the test when no error is thrown;
update the test to explicitly assert rejection instead of swallowing
success—either replace the try/catch with await
expect(discountService.findById("999")).rejects.toThrow(/Discount/) (or
.rejects.toHaveProperty('name','NotFoundError')), or keep the try block but add
a fail() (or throw new Error) immediately after the await to ensure the test
fails if findById does not throw; reference discountService.findById and the
test case name when making the change.

- In `CollectionsSection`, the "See all" handler uses a global `document.querySelector('[data-slot="scroll-area-viewport"]')`, which will target only the first scroll area on the page; consider scoping this via a `ref` to the local `ScrollArea` so the button reliably scrolls the correct list.
- The test changes that cast mocks like `fetchApi as ReturnType<typeof fetchApi>` are misleading, since `ReturnType` refers to the mock’s return value rather than the mock function itself; using `typeof fetchApi` or the concrete mock type would better express the intent and avoid type confusion.