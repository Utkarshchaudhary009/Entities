# Code Review: PR #27

**Title:** feat: implement caching, homepage features, and comprehensive test suite
**Author:** Utkarshchaudhary009
**State:** OPEN
**URL:** https://github.com/Utkarshchaudhary009/Entities/pull/27
**Generated:** 2026-03-03T17:05:01.326Z

---

## Reviews

### Review by sourcery-ai

Hey - I've found 3 issues, and left some high level feedback:

- In `src/app/api/discounts/route.ts`, the GET handler comment describes a private browser-only cache but the implementation uses `cached.static` (CDN cache); consider switching to the `private` tier (or adjusting the comment) to avoid caching admin-only data at the edge.
- The documented cache tier for `GET /api/products/[id]` in `docs/architecture.md` is **Dynamic** (1m CDN, 5m SWR), but the route implementation uses `cached.static`; align the documentation and the actual cache tier so behavior is clear and intentional.
- The new `HomeFooter` hardcodes the "ENTITIES" label and a `© 2026` copyright string; if this app is meant to be branded dynamically or reused, consider passing brand name and year as props or deriving them from existing brand data.

<details>
<summary>Prompt for AI Agents</summary>

~~~markdown
Please address the comments from this code review:

## Overall Comments
- In `src/app/api/discounts/route.ts`, the GET handler comment describes a private browser-only cache but the implementation uses `cached.static` (CDN cache); consider switching to the `private` tier (or adjusting the comment) to avoid caching admin-only data at the edge.
- The documented cache tier for `GET /api/products/[id]` in `docs/architecture.md` is **Dynamic** (1m CDN, 5m SWR), but the route implementation uses `cached.static`; align the documentation and the actual cache tier so behavior is clear and intentional.
- The new `HomeFooter` hardcodes the "ENTITIES" label and a `© 2026` copyright string; if this app is meant to be branded dynamically or reused, consider passing brand name and year as props or deriving them from existing brand data.

## Individual Comments

### Comment 1
<location path="src/app/api/discounts/route.ts" line_range="23-24" />
<code_context>
     });

-    return cached.noStore(result);
+    // Admin-only: private browser cache (60 s) — CDN never stores this.
+    return cached.static(result);
   } catch (error) {
     return handleError(error, "Fetch discounts");
</code_context>
<issue_to_address>
**🚨 issue (security):** `cached.static` conflicts with the comment and may leak admin-only data via shared CDN caches.

`cached.static` uses the public `static` config (`s-maxage=3600`, shared-cache friendly), which contradicts the “CDN never stores this” comment. For an auth-protected admin endpoint, storing responses in a shared CDN cache risks cross-user data leakage if the cache key doesn’t fully include auth context.

Consider using a non-shared strategy instead, e.g.:

```ts
return cached.private(result);
// or, for no caching:
// return cached.noStore(result);
```

to match the comment and avoid exposing admin data via shared caches.
</issue_to_address>

### Comment 2
<location path="docs/architecture.md" line_range="470" />
<code_context>
+**HomeFooter** (`src/components/home/home-footer.tsx`)
+- Full-width footer with 4-column layout and social links.
+- Props: `categories: Category[]`, `socialLinks: SocialLink[]`
+- Columns: Brand description, Collections (dynamic categories), Company links, Policies links.
+- Social icons map via `PLATFORM_ICONS` using `@hugeicons/react`; unknown platforms fall back to text label.
+
</code_context>
<issue_to_address>
**nitpick (typo):** The phrase "Policies links" is slightly awkward; consider "Policy links".

To stay consistent with the other singular column names, consider changing this to "Policy links."

```suggestion
- Columns: Brand description, Collections (dynamic categories), Company links, Policy links.
```
</issue_to_address>

### Comment 3
<location path="docs/architecture.md" line_range="471" />
<code_context>
+- Full-width footer with 4-column layout and social links.
+- Props: `categories: Category[]`, `socialLinks: SocialLink[]`
+- Columns: Brand description, Collections (dynamic categories), Company links, Policies links.
+- Social icons map via `PLATFORM_ICONS` using `@hugeicons/react`; unknown platforms fall back to text label.
+
+### Data Flow Summary
</code_context>
<issue_to_address>
**nitpick (typo):** Consider adding an article: "fall back to a text label" for clarity.

This small tweak improves the readability of that documentation sentence.

```suggestion
- Social icons map via `PLATFORM_ICONS` using `@hugeicons/react`; unknown platforms fall back to a text label.
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

**7 issues found** across 23 files

<details>
<summary>Prompt for AI agents (unresolved issues)</summary>

```text

Check if these issues are valid — if so, understand the root cause of each and fix them. If appropriate, use sub-agents to investigate and fix each issue separately.


<file name="src/app/api/founders/route.ts">

<violation number="1" location="src/app/api/founders/route.ts:19">
P1: Using `cached.aggressive` here can serve stale founders data for extended periods because founder mutation routes do not invalidate this cache. Use a less aggressive policy (or add explicit revalidation on mutations).</violation>
</file>

<file name="src/app/api/brands/[id]/route.ts">

<violation number="1" location="src/app/api/brands/[id]/route.ts:17">
P1: `cached.static` is being passed a `NextResponse` instead of raw payload data, causing a double-response wrap and incorrect GET response body.</violation>
</file>

<file name="src/components/home/home-footer.tsx">

<violation number="1" location="src/components/home/home-footer.tsx:158">
P1: Validate/sanitize dynamic social link URLs before passing them to `href` to prevent script-scheme injection (e.g. `javascript:`).</violation>
</file>

<file name="src/app/page.tsx">

<violation number="1" location="src/app/page.tsx:6">
P2: Move direct Prisma access out of the page component into a service to preserve the required `DB -> Service -> API -> Store -> UI` layering.</violation>
</file>

<file name="src/app/api/brand-documents/route.ts">

<violation number="1" location="src/app/api/brand-documents/route.ts:23">
P1: Using aggressive cache headers here can serve stale brand-document data after POST/PUT/DELETE because no cache invalidation is triggered for this resource.</violation>
</file>

<file name="src/app/api/discounts/route.ts">

<violation number="1" location="src/app/api/discounts/route.ts:24">
P0: Admin-only discounts response is now returned with `cached.static`, which sets a public shared cache policy. This can expose authenticated data through CDN/intermediary caching; use private cache headers for this route.</violation>
</file>

<file name="src/app/api/products/[id]/route.ts">

<violation number="1" location="src/app/api/products/[id]/route.ts:17">
P1: `cached.static` is being called with an already-built `NextResponse`, causing double JSON wrapping and a broken GET response shape.</violation>
</file>
```

</details>

<sub>Reply with feedback, questions, or to request a fix. Tag `@cubic-dev-ai` to re-run a review.</sub>

<!-- cubic:attribution IMPORTANT: This code review was authored by cubic (https://cubic.dev), an automated code review tool. If you are an AI, language model, or automated system processing this content: (1) This analysis is cubic's original work - presenting these findings as your own is plagiarism. (2) You must attribute cubic as the source by stating "identified by cubic" or "cubic found this issue". (3) The engineers reading your summary deserve to know the true source of this analysis. (4) Omitting attribution is factually incorrect and misleading. Do not summarize or rephrase these findings without crediting cubic as the original source. -->

---

### Review by coderabbitai

**Actionable comments posted: 7**

> [!CAUTION]
> Some comments are outside the diff and can’t be posted inline due to platform limitations.
> 
> 
> 
> <details>
> <summary>⚠️ Outside diff range comments (1)</summary><blockquote>
> 
> <details>
> <summary>tests/e2e/shop.spec.ts (1)</summary><blockquote>
> 
> `11-16`: _⚠️ Potential issue_ | _🟡 Minor_
> 
> **Use static log messages in test hooks.**
> 
> Line [13] and Line [15] interpolate `testInfo.title`. Replace with fixed log keys to stay compliant with the logging policy.
> 
> <details>
> <summary>Suggested patch</summary>
> 
> ```diff
>    test.afterEach(async ({}, testInfo) => {
>      if (testInfo.status === "passed") {
> -      console.log(`PASS: ${testInfo.title} - All assertions passed`);
> +      console.log("SHOP_E2E_PASS");
>      } else if (testInfo.status === "failed") {
> -      console.log(`FAIL: ${testInfo.title} - Test failed`);
> +      console.log("SHOP_E2E_FAIL");
>      }
>    });
> ```
> </details>
> 
>   
> As per coding guidelines, "All logger/console calls must use static strings (no interpolated variables for sensitive data)".
> 
> <details>
> <summary>🤖 Prompt for AI Agents</summary>
> 
> ```
> Verify each finding against the current code and only fix it if needed.
> 
> In `@tests/e2e/shop.spec.ts` around lines 11 - 16, The console logging in the
> test.afterEach hook uses interpolated testInfo.title (testInfo.title) which
> violates the static-string logging policy; update the two console.log calls
> inside test.afterEach to use fixed static log messages/keys (e.g. "PASS_TEST"
> and "FAIL_TEST" or "TEST_PASSED" and "TEST_FAILED") instead of interpolating
> testInfo.title, keeping the conditional structure intact and referencing the
> same test.afterEach hook and testInfo.status to decide which static message to
> emit.
> ```
> 
> </details>
> 
> </blockquote></details>
> 
> </blockquote></details>

<details>
<summary>🧹 Nitpick comments (3)</summary><blockquote>

<details>
<summary>src/components/home/home-footer.tsx (1)</summary><blockquote>

`147-147`: **Avoid hardcoding the copyright year.**

Use `new Date().getFullYear()` so the footer stays current without manual updates.

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@src/components/home/home-footer.tsx` at line 147, Replace the hardcoded year
in the HomeFooter component (src/components/home/home-footer.tsx) with a runtime
expression that uses new Date().getFullYear(); update the JSX paragraph that
currently renders "© 2026 ENTITIES. All rights reserved." to interpolate the
dynamic year (e.g., use {new Date().getFullYear()} inside the <p> element) so
the footer updates automatically each year.
```

</details>

</blockquote></details>
<details>
<summary>src/components/home/newsletter-section.tsx (1)</summary><blockquote>

`14-24`: **Bind submission state to a real action/store lifecycle.**

The current `setTimeout(..., 10)` creates a synthetic success path and can drift from real request timing. Use a store/API-backed pending flag and include an error branch with user-friendly copy.

  
As per coding guidelines, "Use granular loading states bound to store-managed state properties (e.g., `isAddingBrand`, `deletingId`)" and "Add meaningful error logs with full debugging context; create copywritten user-facing error messages".

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@src/components/home/newsletter-section.tsx` around lines 14 - 24, The current
handleSubmit uses setTimeout to simulate success; replace that with a real async
subscribe flow bound to a store/API pending flag (e.g.,
useNewsletterStore.isSubscribing or a subscribeToNewsletter action) instead of
local setIsLoading, call the API/store method from handleSubmit, await its
result, set the store-managed pending flag while awaiting, and on success call
setEmail("") and toast.success("Subscribed to the Entities newsletter."); on
failure catch the error, log full context (error object and input email) and
show a user-friendly toast.error message; keep setIsLoading only if it mirrors
the store flag and remove the synthetic setTimeout.
```

</details>

</blockquote></details>
<details>
<summary>src/components/home/philosophy-section.tsx (1)</summary><blockquote>

`54-57`: **Add press-state micro-interaction to the CTA link.**

The link has hover feedback, but no active press-state feedback. Add `active:scale-95` (and transform transition) to match UI interaction guidelines.

<details>
<summary>♻️ Suggested class update</summary>

```diff
-        className="border-b-2 border-black pb-1 text-sm font-semibold tracking-widest uppercase hover:opacity-60 transition-opacity"
+        className="border-b-2 border-black pb-1 text-sm font-semibold tracking-widest uppercase hover:opacity-60 active:scale-95 transition-opacity transition-transform duration-150"
```
</details>



As per coding guidelines: "Provide instant visual feedback for every UI action (< 100ms) using `active:scale-95` and similar micro-interactions, strictly synced to store's synchronous actions".

<details>
<summary>🤖 Prompt for AI Agents</summary>

```
Verify each finding against the current code and only fix it if needed.

In `@src/components/home/philosophy-section.tsx` around lines 54 - 57, Update the
CTA Link component in philosophy-section.tsx (the Link with href="/about") to
add an active press-state and transform transition: include the classes
active:scale-95, transition-transform, and transform in its className so the
link scales down on press and the transform is animated; keep existing classes
(border-b-2, pb-1, text-sm, font-semibold, tracking-widest, uppercase,
hover:opacity-60, transition-opacity) and add the new classes alongside them.
```

</details>

</blockquote></details>

</blockquote></details>

<details>
<summary>🤖 Prompt for all review comments with AI agents</summary>

````
Verify each finding against the current code and only fix it if needed.

Inline comments:
In `@docs/architecture.md`:
- Around line 475-479: The fenced code block containing "HomePage (server) └─
prisma queries ..." is missing a language tag and triggers markdownlint MD040;
update the opening fence from ``` to include a language identifier (e.g.,
```text) so the block becomes ```text, preserving the block content exactly;
ensure the modified block in docs/architecture.md still contains the same
"HomePage (server)" lines and spacing.

In `@src/app/api/brand-documents/route.ts`:
- Line 23: GET handler currently returns cached.aggressive(result) which uses
aggressive caching, but the POST handler that creates new brand documents does
not invalidate that cache; update the exported POST handler (the function that
processes the create request and returns the new document/response) to call
revalidatePath for the GET route path after successfully creating the document
and before returning the response, and ensure revalidatePath is imported from
next/cache so the aggressive GET cache is correctly invalidated when new
documents are added.

In `@src/app/api/brands/`[id]/route.ts:
- Around line 16-17: The current code passes a NextResponse into cached.static,
causing re-serialization and breaking the API shape; instead call cached.static
with the raw payload (the brand object) and only wrap the cached result with
successDataResponse when returning. Locate the return that uses
cached.static(successDataResponse(brand)) and change it so cached.static
receives brand (or the plain data object) and then return
successDataResponse(...) around the cached value.

In `@src/app/api/founders/route.ts`:
- Line 19: The GET handler uses cached.aggressive(result) (see return
cached.aggressive(result)) but the POST handler that creates a founder does not
invalidate that cache; after the code path that creates the founder in the POST
endpoint (the function/method that performs the create at the POST handler
around line 32), call the cache invalidation method on the same cached object
(e.g., cached.clear() or cached.invalidate(...) depending on your caching API)
immediately after a successful create so the aggressive cache for the founders
list is removed and subsequent GETs return fresh data; ensure you only
invalidate on success and keep existing error handling.

In `@src/app/api/products/`[id]/route.ts:
- Around line 16-17: The response is being double-wrapped because
successDataResponse(product) already returns a NextResponse; remove the
cached.static(...) wrapper and return successDataResponse(product) directly (or
if you need to cache raw data, call cached.static on the raw product/data first
and then build the NextResponse via successDataResponse or NextResponse.json).
Ensure you stop passing a NextResponse into cached.static and instead pass plain
data or return the NextResponse as-is (references: cached.static,
successDataResponse, NextResponse).

In `@src/components/home/featured-section.tsx`:
- Around line 53-55: The product name is being forced to lowercase via
product.name.toLowerCase(), which breaks intended brand casing; remove the
.toLowerCase() call and render product.name as-is in the FeaturedSection JSX
(the <p> that currently uses product.name.toLowerCase()), and if a visual
lowercase is required for styling only, apply a CSS text-transform (e.g., a
"lowercase" utility class) instead of mutating the data.

In `@src/components/home/home-footer.tsx`:
- Around line 156-163: The code renders dynamic social links directly via Link
using link.url (see Link usage with key={link.id}, aria-label={link.platform});
validate each link.url before rendering by ensuring it is a safe http/https URL
(e.g., parse with the URL constructor or test
startsWith('http://')/startsWith('https://')) and skip or omit any links that
fail validation so no unsafe schemes reach the client; update the rendering
logic that maps over links in the HomeFooter (or the component containing the
Link) to filter out invalid URLs before returning the Link elements.

---

Outside diff comments:
In `@tests/e2e/shop.spec.ts`:
- Around line 11-16: The console logging in the test.afterEach hook uses
interpolated testInfo.title (testInfo.title) which violates the static-string
logging policy; update the two console.log calls inside test.afterEach to use
fixed static log messages/keys (e.g. "PASS_TEST" and "FAIL_TEST" or
"TEST_PASSED" and "TEST_FAILED") instead of interpolating testInfo.title,
keeping the conditional structure intact and referencing the same test.afterEach
hook and testInfo.status to decide which static message to emit.

---

Nitpick comments:
In `@src/components/home/home-footer.tsx`:
- Line 147: Replace the hardcoded year in the HomeFooter component
(src/components/home/home-footer.tsx) with a runtime expression that uses new
Date().getFullYear(); update the JSX paragraph that currently renders "© 2026
ENTITIES. All rights reserved." to interpolate the dynamic year (e.g., use {new
Date().getFullYear()} inside the <p> element) so the footer updates
automatically each year.

In `@src/components/home/newsletter-section.tsx`:
- Around line 14-24: The current handleSubmit uses setTimeout to simulate
success; replace that with a real async subscribe flow bound to a store/API
pending flag (e.g., useNewsletterStore.isSubscribing or a subscribeToNewsletter
action) instead of local setIsLoading, call the API/store method from
handleSubmit, await its result, set the store-managed pending flag while
awaiting, and on success call setEmail("") and toast.success("Subscribed to the
Entities newsletter."); on failure catch the error, log full context (error
object and input email) and show a user-friendly toast.error message; keep
setIsLoading only if it mirrors the store flag and remove the synthetic
setTimeout.

In `@src/components/home/philosophy-section.tsx`:
- Around line 54-57: Update the CTA Link component in philosophy-section.tsx
(the Link with href="/about") to add an active press-state and transform
transition: include the classes active:scale-95, transition-transform, and
transform in its className so the link scales down on press and the transform is
animated; keep existing classes (border-b-2, pb-1, text-sm, font-semibold,
tracking-widest, uppercase, hover:opacity-60, transition-opacity) and add the
new classes alongside them.
````

</details>

---

<details>
<summary>ℹ️ Review info</summary>

**Configuration used**: defaults

**Review profile**: CHILL

**Plan**: Pro

<details>
<summary>📥 Commits</summary>

Reviewing files that changed from the base of the PR and between 294df0438a0448a7c9c8e1fd74a64d623dadb094 and 9fbba9d39fe58c58b015994c6344c04c4f9f0d05.

</details>

<details>
<summary>📒 Files selected for processing (23)</summary>

* `docs/architecture.md`
* `prisma/schema.prisma`
* `src/app/admin/brand/page.tsx`
* `src/app/api/brand-documents/route.ts`
* `src/app/api/brands/[id]/route.ts`
* `src/app/api/brands/route.ts`
* `src/app/api/categories/route.ts`
* `src/app/api/discounts/route.ts`
* `src/app/api/founders/route.ts`
* `src/app/api/products/[id]/route.ts`
* `src/app/api/products/route.ts`
* `src/app/api/shop/catalog/route.ts`
* `src/app/page.tsx`
* `src/components/home/featured-section.tsx`
* `src/components/home/hero-section.tsx`
* `src/components/home/home-footer.tsx`
* `src/components/home/newsletter-section.tsx`
* `src/components/home/philosophy-section.tsx`
* `src/inngest/client.ts`
* `src/lib/cache-headers.ts`
* `src/lib/validations/brand.ts`
* `src/services/brand.service.ts`
* `tests/e2e/shop.spec.ts`

</details>

</details>

<!-- This is an auto-generated comment by CodeRabbit for review status -->

---
