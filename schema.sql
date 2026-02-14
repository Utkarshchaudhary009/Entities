
CREATE TABLE public.authors (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT authors_pkey PRIMARY KEY (id)

);

CREATE TABLE public.blogs (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  author_id uuid NOT NULL,
  featured_image_url text,
  is_published boolean DEFAULT false,
  reading_time_minutes integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blogs_pkey PRIMARY KEY (id),
  CONSTRAINT blogs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id)

);

CREATE TABLE public.cart_history (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  product_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['added'::text, 'removed'::text, 'quantity_updated'::text])),
  quantity integer NOT NULL,
  selected_size text,
  selected_color text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_history_pkey PRIMARY KEY (id),
  CONSTRAINT cart_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)

);

CREATE TABLE public.cart_items (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT (auth.jwt() ->> 'sub'::text),
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_size text,
  selected_color text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)

);

CREATE TABLE public.company_links (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_links_pkey PRIMARY KEY (id)

);

CREATE TABLE public.favorites (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)

);

CREATE TABLE public.messages (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  replied boolean DEFAULT false,
  replied_at timestamp with time zone,
  CONSTRAINT messages_pkey PRIMARY KEY (id)

);

CREATE TABLE public.order_items (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  selected_size text,
  selected_color text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)

);

CREATE TABLE public.orders (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  total_amount numeric NOT NULL,
  shipping_address jsonb NOT NULL,
  billing_address jsonb NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending'::text,
  tracking_number text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id)

);

CREATE TABLE public.products (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text,
  stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sizes ARRAY DEFAULT '{}'::text[],
  colors ARRAY DEFAULT '{}'::text[],
  material text,
  care_instructions text,
  images ARRAY DEFAULT '{}'::text[],
  detailed_description text,
  CONSTRAINT products_pkey PRIMARY KEY (id)

);

CREATE TABLE public.reviews (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  product_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)

);

CREATE TABLE public.shipping_addresses (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id)

);

CREATE TABLE public.uploads (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT (auth.jwt() ->> 'sub'::text),
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  title text,
  description text,
  tags ARRAY DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT uploads_pkey PRIMARY KEY (id)

);

CREATE TABLE public.user_preferences (

  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  preferred_language text DEFAULT 'en'::text,
  preferred_currency text DEFAULT 'USD'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id)

);
-- ==========================================
-- 1. Enable RLS on All Tables
-- ==========================================
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Public Catalog Tables (Read: Everyone, Write: Admin)
-- ==========================================

-- PRODUCTS
CREATE POLICY "Public Read Products"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Admin All Products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'metadata')::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'metadata')::jsonb ->> 'role' = 'admin'
  );

-- AUTHORS & BLOGS
CREATE POLICY "Public Read Authors"
  ON public.authors
  FOR SELECT
  USING (true);

CREATE POLICY "Public Read Blogs"
  ON public.blogs
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin Manage Blogs"
  ON public.blogs
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'metadata')::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'metadata')::jsonb ->> 'role' = 'admin'
  );

-- COMPANY LINKS
CREATE POLICY "Public Read Links"
  ON public.company_links
  FOR SELECT
  USING (true);

-- ==========================================
-- 3. Private User Data (Cart, Orders, Favorites)
-- ==========================================

-- CART ITEMS (Strict Ownership)
CREATE POLICY "User manage own cart"
  ON public.cart_items
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- CART HISTORY
CREATE POLICY "User view own cart history"
  ON public.cart_history
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "User insert own cart history"
  ON public.cart_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- FAVORITES
CREATE POLICY "User manage favorites"
  ON public.favorites
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- SHIPPING ADDRESSES
CREATE POLICY "User manage addresses"
  ON public.shipping_addresses
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- USER PREFERENCES
CREATE POLICY "User manage preferences"
  ON public.user_preferences
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- ==========================================
-- 4. Orders & Transactional Data
-- ==========================================

-- ORDERS
CREATE POLICY "User view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "User create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- ORDER ITEMS (Linked via Order ID)
-- Users can see items if they own the parent order
CREATE POLICY "User view own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = (auth.jwt() ->> 'sub')
    )
  );

-- ==========================================
-- 5. User Content & Interactions
-- ==========================================

-- REVIEWS
CREATE POLICY "Public read reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "User create reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "User edit own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- MESSAGES (Contact Form)
-- Anyone can insert (send message)
CREATE POLICY "Public send message"
  ON public.messages
  FOR INSERT
  WITH CHECK (true);

-- Admin manage messages (read and manage)
CREATE POLICY "Admin manage messages"
  ON public.messages
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'metadata')::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'metadata')::jsonb ->> 'role' = 'admin'
  );

-- UPLOADS
CREATE POLICY "Admin manage uploads"
  ON public.uploads
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'metadata')::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'metadata')::jsonb ->> 'role' = 'admin'
  );
