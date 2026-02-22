# Database Schema - Entities

## Overview

**Database:** Supabase (PostgreSQL)
**Naming Convention:** snake_case for tables/columns, camelCase in application layer

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌──────────────────┐
│  categories │───┐   │   products  │───┐   │ product_variants │
└─────────────┘   │   └─────────────┘   │   └──────────────────┘
                  │                     │            │
                  └─────────────────────┘            │
                                                     │
┌─────────────┐       ┌─────────────┐               │
│    carts    │───────│ cart_items  │───────────────┘
└─────────────┘       └─────────────┘
                              
┌─────────────┐       ┌─────────────┐       ┌──────────────────┐
│   orders    │───────│ order_items │───────│ product_variants │
└─────────────┘       └─────────────┘       └──────────────────┘
      │
      │
┌─────────────┐
│  discounts  │
└─────────────┘
```

---

## Tables

### 1. categories

Product categories managed by admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | NOT NULL | Category name (e.g., "Tees", "Bottoms") |
| `slug` | TEXT | NOT NULL, UNIQUE | URL-friendly identifier |
| `thumbnail_url` | TEXT | NULLABLE | Category thumbnail image |
| `about` | TEXT | NULLABLE | Category description |
| `discount_percent` | INTEGER | DEFAULT 0 | Category-wide discount (0-100) |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Business Rules:**
- `discount_percent`: Applies to all products in category
- `slug`: Auto-generated from name if not provided
- `sort_order`: Lower numbers appear first

---

### 2. products

Main product catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | NOT NULL | Product name |
| `slug` | TEXT | NOT NULL, UNIQUE | URL-friendly identifier |
| `description` | TEXT | NULLABLE | Product description |
| `price` | INTEGER | NOT NULL | Price in paise (₹899 = 89900) |
| `compare_at_price` | INTEGER | NULLABLE | Original price for strike-through |
| `category_id` | UUID | FK → categories.id, NULLABLE | Parent category |
| `thumbnail_url` | TEXT | NULLABLE | Main product image |
| `images` | TEXT[] | DEFAULT '{}' | Array of image URLs |
| `is_featured` | BOOLEAN | DEFAULT FALSE | Show on homepage |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Business Rules:**
- `price`: Stored in paise to avoid floating point issues
- `compare_at_price`: Shows "discount" if set and higher than price
- `slug`: Auto-generated from name
- `images`: First image should match `thumbnail_url`

**Computed Fields (Application Layer):**
- `total_stock`: Sum of all variant stock
- `effective_price`: price - (category.discount_percent * price / 100)
- `is_low_stock`: total_stock < 5
- `is_out_of_stock`: total_stock = 0

---

### 3. product_variants

Size and color combinations for products.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `product_id` | UUID | NOT NULL, FK → products.id ON DELETE CASCADE | Parent product |
| `size` | TEXT | NOT NULL | Size label (S, M, L, XL, etc.) |
| `color` | TEXT | NOT NULL | Color name (Black, White, etc.) |
| `color_hex` | TEXT | NULLABLE | Color hex code for display |
| `stock` | INTEGER | DEFAULT 0 | Available inventory |
| `sku` | TEXT | UNIQUE | Stock keeping unit |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Business Rules:**
- Unique constraint on `(product_id, size, color)`
- `sku`: Format `ENT-{product_short}-{size}-{color}` (e.g., `ENT-TEE001-M-BLK`)
- `stock`: Cannot be negative (enforced by trigger)
- `color_hex`: Used for color swatch display

**Indexes:**
- `idx_product_variants_product` ON `(product_id)`
- `idx_product_variants_sku` ON `(sku)`

---

### 4. carts

Session-based shopping carts (guest-first).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `session_id` | TEXT | NOT NULL, UNIQUE | Browser session identifier |
| `user_id` | TEXT | NULLABLE | Clerk User ID (if logged in) |
| `customer_email` | TEXT | NULLABLE | Optional email for notifications |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Business Rules:**
- `session_id`: Generated on first visit, stored in localStorage
- `user_id`: Linked when user logs in
- Carts expire after 30 days of inactivity (cleanup job)
- One cart per session

**Indexes:**
- `idx_carts_session` ON `(session_id)`
- `idx_carts_user` ON `(user_id)`
- `idx_carts_updated` ON `(updated_at)`

---

### 5. cart_items

Items in shopping carts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `cart_id` | UUID | NOT NULL, FK → carts.id ON DELETE CASCADE | Parent cart |
| `product_variant_id` | UUID | NOT NULL, FK → product_variants.id | Selected variant |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1, CHECK >= 1 | Item quantity |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Business Rules:**
- Unique constraint on `(cart_id, product_variant_id)`
- `quantity`: Max 10 per variant (enforced in application)
- Triggers `updated_at` on parent cart

**Indexes:**
- `idx_cart_items_cart` ON `(cart_id)`
- `idx_cart_items_variant` ON `(product_variant_id)`

---

### 6. orders

Customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `order_number` | TEXT | NOT NULL, UNIQUE | Human-readable order ID |
| `user_id` | TEXT | NULLABLE | Clerk User ID (if logged in) |
| `customer_name` | TEXT | NOT NULL | Customer full name |
| `whatsapp_number` | TEXT | NOT NULL | Contact WhatsApp |
| `email` | TEXT | NULLABLE | Optional email |
| `address` | TEXT | NOT NULL | Full address |
| `city` | TEXT | NOT NULL | City name |
| `state` | TEXT | NOT NULL | State name |
| `pincode` | TEXT | NOT NULL | Postal code |
| `subtotal` | INTEGER | NOT NULL | Subtotal in paise |
| `discount_code` | TEXT | NULLABLE | Applied discount code |
| `discount_amount` | INTEGER | DEFAULT 0 | Discount in paise |
| `shipping_cost` | INTEGER | DEFAULT 0 | Shipping in paise |
| `total` | INTEGER | NOT NULL | Final total in paise |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | Order status |
| `notes` | TEXT | NULLABLE | Customer notes |
| `admin_notes` | TEXT | NULLABLE | Internal notes |
| `whatsapp_message_id` | TEXT | NULLABLE | WhatsApp message SID |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Order timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Status Values:**
| Status | Description |
|--------|-------------|
| `pending` | Order placed, awaiting confirmation |
| `confirmed` | Admin confirmed, preparing |
| `shipped` | Out for delivery |
| `delivered` | Delivered to customer |
| `cancelled` | Order cancelled |

**Business Rules:**
- `order_number`: Format `ENT-{YYYY}-{MM}-{NNNN}` (e.g., `ENT-2026-02-0001`)
- Auto-incrementing sequence per month
- `total` = `subtotal` - `discount_amount` + `shipping_cost`

**Indexes:**
- `idx_orders_number` ON `(order_number)`
- `idx_orders_user` ON `(user_id)`
- `idx_orders_status` ON `(status)`
- `idx_orders_created` ON `(created_at DESC)`
- `idx_orders_whatsapp` ON `(whatsapp_number)`

---

### 7. order_items

Items within orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `order_id` | UUID | NOT NULL, FK → orders.id ON DELETE CASCADE | Parent order |
| `product_variant_id` | UUID | FK → product_variants.id, NULLABLE | Reference to variant |
| `product_name` | TEXT | NOT NULL | Product name at time of order |
| `product_image` | TEXT | NULLABLE | Product image at time of order |
| `size` | TEXT | NOT NULL | Size at time of order |
| `color` | TEXT | NOT NULL | Color at time of order |
| `quantity` | INTEGER | NOT NULL | Quantity ordered |
| `unit_price` | INTEGER | NOT NULL | Price per unit in paise |
| `total_price` | INTEGER | NOT NULL | Total price in paise |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Business Rules:**
- `product_variant_id`: Nullable because product may be deleted later
- `product_name`, `size`, `color`: Snapshot at order time (immutable)
- `total_price` = `unit_price` * `quantity`

**Indexes:**
- `idx_order_items_order` ON `(order_id)`

---

### 8. discounts

Discount codes for checkout.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `code` | TEXT | NOT NULL, UNIQUE | Discount code (uppercase) |
| `description` | TEXT | NULLABLE | Internal description |
| `discount_type` | TEXT | NOT NULL, DEFAULT 'percentage' | Type of discount |
| `value` | INTEGER | NOT NULL | Discount value |
| `min_order_value` | INTEGER | DEFAULT 0 | Minimum order amount |
| `max_discount` | INTEGER | NULLABLE | Maximum discount amount |
| `usage_limit` | INTEGER | NULLABLE | Total usage limit |
| `usage_count` | INTEGER | DEFAULT 0 | Current usage count |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| `starts_at` | TIMESTAMPTZ | NULLABLE | Valid from |
| `expires_at` | TIMESTAMPTZ | NULLABLE | Valid until |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Discount Types:**
| Type | Description |
|------|-------------|
| `percentage` | `value` is percentage (e.g., 10 = 10% off) |
| `fixed` | `value` is amount in paise (e.g., 50000 = ₹500 off) |

**Business Rules:**
- `code`: Always stored as uppercase
- `usage_count`: Incremented on each use
- `is_active`: Combined with dates for validity check
- `max_discount`: For percentage type, caps the discount

**Computed Validity (Application Layer):**
```typescript
isValid(discount) {
  return discount.is_active 
    && discount.usage_count < (discount.usage_limit ?? Infinity)
    && (!discount.starts_at || discount.starts_at <= now)
    && (!discount.expires_at || discount.expires_at >= now)
}
```

**Indexes:**
- `idx_discounts_code` ON `(code)`
- `idx_discounts_active` ON `(is_active)` WHERE `is_active = TRUE`

---

### 9. sizes

Size definitions for consistency.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `label` | TEXT | NOT NULL, UNIQUE | Size label (S, M, L, XL) |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |
| `measurements` | JSONB | NULLABLE | Size chart data |

**Measurements Structure:**
```json
{
  "chest": { "min": 36, "max": 38, "unit": "inches" },
  "length": { "min": 26, "max": 27, "unit": "inches" },
  "shoulder": { "min": 17, "max": 18, "unit": "inches" }
}
```

---

### 10. colors

Color definitions for consistency.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | NOT NULL, UNIQUE | Color name (Black, White) |
| `hex` | TEXT | NOT NULL | Hex code (#000000) |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |

---

### 11. admin_users

Admin user references (Linked to Clerk).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `clerk_id` | TEXT | NOT NULL, UNIQUE | Clerk user ID |
| `email` | TEXT | NOT NULL | Admin email |
| `name` | TEXT | NULLABLE | Admin name |
| `role` | TEXT | NOT NULL, DEFAULT 'admin' | Admin role |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Roles:**
| Role | Permissions |
|------|-------------|
| `super_admin` | Full access, manage admins |
| `admin` | Products, orders, categories |
| `viewer` | Read-only dashboard |

**Note:** This table is for application-level data and dashboard rendering. Actual RLS permissions should rely on the `user_role` claim in the Clerk JWT for performance.

---

## Database Functions

### 1. generate_order_number()

```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  month_prefix TEXT;
  next_num INTEGER;
  order_num TEXT;
BEGIN
  month_prefix := to_char(now(), 'YYYY-MM');
  
  SELECT COALESCE(MAX(
    CAST(substring(order_number from 12 for 4) AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM orders
  WHERE order_number LIKE 'ENT-' || month_prefix || '-%';
  
  order_num := 'ENT-' || month_prefix || '-' || lpad(next_num::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;
```

### 2. decrement_stock()

```sql
CREATE OR REPLACE FUNCTION decrement_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id AND stock >= p_quantity;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

### 3. restore_stock()

```sql
CREATE OR REPLACE FUNCTION restore_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock = stock + p_quantity
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### 1. update_timestamp

```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_categories_timestamp
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_carts_timestamp
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_orders_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### 2. update_cart_timestamp_on_item_change

```sql
CREATE OR REPLACE FUNCTION update_cart_timestamp_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE carts SET updated_at = NOW() WHERE id = NEW.cart_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE carts SET updated_at = NOW() WHERE id = NEW.cart_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE carts SET updated_at = NOW() WHERE id = OLD.cart_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_timestamp_on_item_change();
```

---

## Security & Permissions (Clerk + Supabase)

We use **Native Integration** with Clerk. Authentication is handled by Clerk, which issues a JWT. Supabase validates this JWT and extracts claims for Row Level Security (RLS).

### 1. Helper Functions
Access Clerk claims safely.

```sql
-- Get the Clerk User ID (sub)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'sub';
$$ LANGUAGE sql STABLE;

-- Get the User Role (custom claim 'user_role')
CREATE OR REPLACE FUNCTION requesting_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'role';
$$ LANGUAGE sql STABLE;
```

### 2. RLS Policies

**Enable RLS on all tables:**
```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- etc.
```

#### Public Catalog (Categories, Products, Variants)
*   **Public:** Read-only.
*   **Admins:** Full access.

```sql
-- READ
CREATE POLICY "Public Read Access"
ON products FOR SELECT
USING (is_active = TRUE OR requesting_user_role() IN ('admin'));

-- WRITE (Admin only)
CREATE POLICY "Admin Write Access"
ON products FOR ALL
USING (requesting_user_role() IN ('admin'));
```

#### User Data (Orders)
*   **Users:** View their own orders.
*   **Admins:** View/Manage all.

```sql
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (
  requesting_user_id() = user_id
  OR requesting_user_role() IN ('admin')
);
```

#### Shopping Carts
*   **Guests:** Managed via Server Actions (Application Logic).
*   **Authenticated Users:** View/Manage their own carts.

```sql
CREATE POLICY "Users can manage own carts"
ON carts FOR ALL
USING (requesting_user_id() = user_id);
```

---

## Indexes Summary

| Table | Index | Columns |
|-------|-------|---------|
| products | `idx_products_category` | `(category_id)` |
| products | `idx_products_featured` | `(is_featured)` WHERE `is_active = TRUE` |
| products | `idx_products_slug` | `(slug)` |
| product_variants | `idx_product_variants_product` | `(product_id)` |
| product_variants | `idx_product_variants_sku` | `(sku)` |
| carts | `idx_carts_session` | `(session_id)` |
| carts | `idx_carts_user` | `(user_id)` |
| carts | `idx_carts_updated` | `(updated_at)` |
| cart_items | `idx_cart_items_cart` | `(cart_id)` |
| orders | `idx_orders_number` | `(order_number)` |
| orders | `idx_orders_user` | `(user_id)` |
| orders | `idx_orders_status` | `(status)` |
| orders | `idx_orders_created` | `(created_at DESC)` |
| orders | `idx_orders_whatsapp` | `(whatsapp_number)` |
| discounts | `idx_discounts_code` | `(code)` |

---

## Migration Order

1. `001_create_sizes_colors.sql` - Reference tables
2. `002_create_categories.sql` - Categories
3. `003_create_products.sql` - Products and variants
4. `004_create_carts.sql` - Carts and cart items
5. `005_create_orders.sql` - Orders and order items
6. `006_create_discounts.sql` - Discount codes
7. `007_create_admin_users.sql` - Admin users
8. `008_create_functions_triggers.sql` - Functions and triggers
9. `009_enable_rls.sql` - Row level security
