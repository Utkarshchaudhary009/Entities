# Entities - Premium Streetwear Webapp

## Brand Overview

- **Name:** Entities
- **Target Audience:** 17-27 years old
- **Price Range:** ₹799 - ₹1499
- **Aesthetic:** Premium streetwear
- **Core Focus:** Fast, responsive UX with premium feel

---

## User Flow

```
Landing → Browse/Shop → Product Detail → Add to Cart → Cart → WhatsApp Checkout
                                    ↓
                              Size Guide Modal
```

### Guest-First Approach
- No forced login to browse or checkout
- Optional account creation after order for order tracking
- Minimal friction experience

---

## Pages & Features

### 1. Home Page (`/`)

**Purpose:** Brand introduction, showcase products, drive conversions

**Sections:**
- Hero section with brand video/Image carousel
- Featured/Drop products (limited time urgency)
- New arrivals grid
- Category showcase with thumbnails
- Newsletter signup
- Instagram feed integration

**UX Focus:**
- Above-fold CTA within 3 seconds
- Smooth scroll animations
- Fast image loading with blur placeholders

---

### 2. Shop Page (`/shop`)

**Purpose:** Browse and filter products efficiently

**Features:**
- Product grid with filters
  - Category filter
  - Size filter
  - Price range
  - Sort options (newest, price low-high, price high-low)
- Infinite scroll or pagination
- Quick add to cart from grid
- Search functionality
- Mobile-optimized filter drawer

**UX Focus:**
- Instant filter updates (no page reload)
- Skeleton loaders during data fetch
- Persistent scroll position on back navigation

---

### 3. Product Page (`/product/[slug]`)

**Purpose:** Convert interest to cart addition

**Features:**
- Image gallery
  - Zoom on hover (desktop)
  - Swipe carousel (mobile)
  - Thumbnail navigation
- Size selector with availability indicator
- Size guide modal (measurements, fit info)
- Color variant selector
- Add to cart CTA with feedback
- Stock indicator (low stock urgency message)
- Related products carousel
- Breadcrumb navigation

**UX Focus:**
- Critical path: Image → Size → Add to Cart
- Instant size guide access
- Clear out-of-stock indication
- Optimistic cart updates

---

### 4. Cart Page (`/cart`)

**Purpose:** Review order, proceed to checkout

**Features:**
- Cart items list
  - Product image, name, size, color
  - Quantity adjustment (+/-)
  - Remove item
  - Price per item and total
- Size guide access
- Order summary
  - Subtotal
  - Discount code input
  - Discount applied display
  - Total
- WhatsApp checkout button
- Continue shopping link
- Empty cart state with CTA

**UX Focus:**
- Instant quantity updates
- Real-time total recalculation
- Clear checkout CTA
- Persistent cart (localStorage + Zustand)

---

### 5. Admin Dashboard (`/admin`)

**Authentication:** Separate from customer auth (Clerk organization or role-based access)

#### 5.1 Dashboard Overview (`/admin`)
- Sales overview cards (today, week, month)
- Recent orders list
- Low stock alerts
- Quick actions

#### 5.2 Products Management (`/admin/products`)
- Product list with search/filter
- Add new product
  - Name, slug (auto-generated)
  - Description (rich text)
  - Price
  - Category selection
  - Images upload (multiple)
  - Variants (size + color combinations)
  - Stock per variant
  - Featured toggle
- Edit product
- Delete product (with confirmation)
- Bulk actions (activate/deactivate)

#### 5.3 Categories Management (`/admin/categories`)
- Category list
- Add new category
  - Name
  - Thumbnail image upload
  - Description/About
  - Discount percentage (optional)
- Edit category
- Delete category (check for linked products)

#### 5.4 Orders Management (`/admin/orders`)
- Orders list with status filter
- Order detail view
  - Customer info (name, WhatsApp, email, address)
  - Order items
  - Total, discount applied
  - Order date/time
  - Status badge
- Status update (Pending → Confirmed → Shipped → Delivered)
- WhatsApp message log

#### 5.5 Customers (`/admin/customers`)
- Customer list (from orders)
- Customer detail
  - Order history
  - Total spent
  - Contact info

#### 5.6 Analytics (`/admin/analytics`)
- Sales by period (day, week, month, year)
- Top selling products
- Category performance
- Revenue trends chart

#### 5.7 Discounts (`/admin/discounts`)
- Discount codes list
- Create discount code
  - Code
  - Percentage off
  - Active/inactive toggle
  - Expiry date
- Edit/Delete discount codes

#### 5.8 Settings (`/admin/settings`)
- Store info (name, logo, contact)
- WhatsApp number configuration
- Shipping info
- Social links

---

## Database Schema (Supabase)

```sql
-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  thumbnail_url TEXT,
  about TEXT,
  discount_percent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- stored in paise (₹799 = 79900)
  category_id UUID REFERENCES categories(id),
  thumbnail_url TEXT,
  images TEXT[], -- array of image URLs
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants (size, color combinations)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart (session-based for guests)
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount_code TEXT,
  discount_amount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discount Codes
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  percent_off INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

---

## Performance Strategy

| Technique | Implementation | Impact |
|-----------|---------------|--------|
| **Perceived Speed** | Skeleton loaders, optimistic UI updates | Feels instant |
| **ISR/SSG** | Static product pages with revalidation | Fast initial load |
| **Image Optimization** | Next.js Image with blur placeholders | Faster LCP |
| **Font Loading** | `next/font` with display:swap | No FOIT |
| **Code Splitting** | Dynamic imports for heavy components | Smaller bundles |
| **Zustand Persist** | Cart synced to localStorage instantly | Instant cart state |
| **Edge Caching** | Static assets on CDN | Global performance |
| **Prefetching** | Link hover prefetch for product pages | Instant navigation |
| **Debounced Search** | 300ms debounce on search input | Reduced API calls |
| **Virtual Lists** | For long product lists | Smooth scrolling |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Database | Supabase (PostgreSQL) | Database, storage, real-time |
| Auth | Clerk | Customer & admin authentication |
| State | Zustand | Cart state, UI state |
| Styling | Tailwind CSS | Utility-first styling |
| Animations | Framer Motion | Subtle micro-interactions |
| Icons | Lucide React | Consistent icon library |
| Forms | React Hook Form + Zod | Form handling & validation |
| Image Storage | Supabase Storage | Product images |

---

## Project Structure

```
src/
├── app/
│   ├── (shop)/                 # Public customer routes
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Home
│   │   ├── shop/
│   │   │   └── page.tsx        # Shop listing
│   │   ├── product/
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Product detail
│   │   └── cart/
│   │       └── page.tsx        # Cart
│   ├── admin/                  # Protected admin routes
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard
│   │   ├── products/
│   │   ├── categories/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── analytics/
│   │   ├── discounts/
│   │   └── settings/
│   └── api/                    # API routes
│       ├── cart/
│       ├── checkout/
│       ├── products/
│       └── webhooks/
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── shop/                   # Shop-specific components
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── filter-drawer.tsx
│   │   ├── size-guide.tsx
│   │   └── ...
│   ├── cart/                   # Cart components
│   │   ├── cart-item.tsx
│   │   ├── cart-summary.tsx
│   │   └── ...
│   ├── admin/                  # Admin components
│   │   ├── sidebar.tsx
│   │   ├── stats-card.tsx
│   │   └── ...
│   └── layout/                 # Layout components
│       ├── header.tsx
│       ├── footer.tsx
│       └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── admin.ts            # Admin client
│   ├── clerk/
│   │   └── index.ts
│   ├── whatsapp.ts             # WhatsApp API utilities
│   └── utils.ts                # Utility functions
├── store/
│   ├── cart-store.ts           # Zustand cart store
│   └── ui-store.ts             # UI state (modals, etc.)
├── hooks/
│   ├── use-cart.ts
│   ├── use-local-storage.ts
│   └── ...
├── types/
│   ├── database.ts             # Supabase generated types
│   └── index.ts                # App types
└── styles/
    └── globals.css
```

---

## WhatsApp Checkout Flow

1. User adds items to cart
2. User fills checkout form (name, WhatsApp, address)
3. User clicks "Order on WhatsApp"
4. System generates formatted message:
   ```
   🛒 *New Order - Entities*
   
   Order #: ENT-2024-001
   Date: 21 Feb 2026, 3:45 PM
   
   *Customer Details:*
   Name: John Doe
   WhatsApp: +91 98765 43210
   Address: 123 Main St, Mumbai, 400001
   
   *Items:*
   1. Classic Oversized Tee (Black, M) x2 - ₹1,598
   2. Cargo Pants (Olive, L) x1 - ₹1,299
   
   *Subtotal:* ₹2,897
   *Discount (SAVE10):* -₹290
   *Total:* ₹2,607
   
   Please confirm your order!
   ```
5. Opens WhatsApp with pre-filled message to admin number
6. Admin receives order on WhatsApp
7. Admin confirms and updates order status in dashboard

---

## Next Steps

1. [ ] Set up Supabase project (database, storage buckets)
2. [ ] Configure Clerk authentication
3. [ ] Initialize Next.js project structure
4. [ ] Create database schema and types
5. [ ] Build core UI components
6. [ ] Implement shop pages
7. [ ] Build cart functionality with Zustand
8. [ ] Implement WhatsApp checkout
9. [ ] Build admin dashboard
10. [ ] Add analytics and tracking
11. [ ] Performance optimization
12. [ ] Testing and deployment

---

## Success Metrics

- **Performance:** Lighthouse score 90+ on all pages
- **Load Time:** First Contentful Paint < 1.5s
- **Cart Persistence:** Zero cart data loss
- **Checkout Completion:** < 3 clicks from cart to WhatsApp
- **Admin Efficiency:** Product upload < 2 minutes
