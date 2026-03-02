# Shop Page Design: Mobile-First Search & Product Drawer

## 1. Overview and Architecture
The `/shop` page will act as a mobile-optimized gateway for discovery. Instead of external search dependencies like Algolia, we will leverage client-side fuzzy search on a cached payload for 0ms latency. The UI focuses on immediate gratification: showing New Arrivals on load, instant search results on type, and a premium Drawer for product details without leaving the page.

### Data Flow
1. **Catalog Payload:** An Edge-cached endpoint (`/api/shop/catalog`) returns a lightweight index of active products (`id`, `name`, `thumbnailUrl`, `price`, `categorySlug`), add revalidation of thins path on products api edit, create or delete path.
2. **Search Store:** `useShopStore` fetches the catalog on mount. It uses `fuse.js` to instantly filter the catalog in memory based on the `searchQuery`.
3. **Hydration (Drawer):** When a user clicks a product, the Drawer opens instantly with the cached basic info. Simultaneously, it triggers `useProductStore().fetchProduct(id)` to load variants, full images, and stock.

## 2. Component Design

### 2.1 The `/shop` Page (`src/app/(user)/shop/page.tsx`)
- **Sticky Header:** A prominent, sticky search input (`Command` pattern adapted for mobile). 
- **Categories Bar:** A horizontal scrolling list of rounded pills for categories. Clicking one updates the URL (`?category=slug`). Visible only when search is empty.
- **Product Grid:** 
    - **Default State:** Displays "New Arrivals" (fetched via `useProductStore().fetchProducts({ sort: "newest" })`).
    - **Active State:** As the user types, the grid instantly swaps to the client-side `fuse.js` results.

### 2.2 The Product Drawer (`src/components/shop/product-drawer.tsx`)
Inspired by premium desktop e-commerce layouts, translated into a mobile bottom sheet (`Drawer` from `vaul`).

- **Visual Gallery:** 
    - A large, edge-to-edge image view.
    - **Optimization:** The gallery images are driven by the *selected variant*. When the user changes the color, the gallery instantly updates to that variant's specific images.
- **Header:** Brand/SKU (muted), large Product Name, bold Price.
- **Variant Selectors:**
    - **Colors:** Swatches or small thumbnails with a sleek active border.
    - **Sizes:** A flex wrap of pills. Selected state is solid black with white text.
- **Sticky Action Bar:** Fixed to the bottom of the screen.
    - Full-width "Add to Cart" button.
    - Heart/Favorite icon button alongside it.
    - Subtle "Free delivery..." text below.
- **Loading State:** While `fetchProduct` fetches the variants, the variant selectors and Add to Cart button display `tw-animate-css` skeletons to prevent layout shift.

## 3. Implementation Steps
1. Create `/api/shop/catalog/route.ts` for the lightweight index.
2. Build `src/stores/shop.store.ts` implementing `fuse.js` logic.
3. Build the core `/shop` layout (Header, Categories Bar, Grid).
4. Implement the `ProductDrawer` component with variant-driven galleries and skeletons.
5. Integrate the Drawer with `useProductStore` and `useCartStore`.
