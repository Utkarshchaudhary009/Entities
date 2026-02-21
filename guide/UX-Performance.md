# UX Performance Guidelines - Entities

## Core Philosophy
> "The fastest response is the one that never needs to wait."

---

## 5 Unique Ways to Make Responses Feel Instant

### 1. Optimistic UI Updates (Zero-Latency Actions)

**Concept:** Update the UI immediately when user acts, don't wait for server confirmation. Revert only on actual failure.

**Implementation:**

```tsx
// Cart Store with Optimistic Updates
const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: async (item) => {
    const prevItems = get().items
    
    // 1. INSTANT UI UPDATE
    set((state) => ({
      items: [...state.items, item],
      isAdding: true
    }))
    
    // 2. Show success feedback immediately
    toast.success(`Added ${item.name} to cart`)
    
    try {
      // 3. Sync with server in background
      await supabase.from('cart_items').insert(item)
    } catch (error) {
      // 4. Revert only on failure
      set({ items: prevItems })
      toast.error('Failed to add. Please try again.')
    } finally {
      set({ isAdding: false })
    }
  }
}))
```

**Where to Apply:**
| Action | Optimistic Behavior |
|--------|---------------------|
| Add to Cart | Item appears instantly with animation |
| Remove from Cart | Item fades out immediately |
| Change Quantity | Number updates instantly |
| Apply Discount | Total recalculates immediately |
| Filter Products | Grid updates instantly, load in background |

**Micro-copy Feedback:**
- Adding: "Adding..." (show for <300ms, then success)
- Success: ✓ "Added to cart"
- Error: "Oops! Let's try that again"

---

### 2. Skeleton Loading with Progressive Reveals

**Concept:** Show the exact structure of content instantly with placeholder shapes. Reveal content progressively as it loads.

**Implementation:**

```tsx
// Skeleton Component that matches exact layout
const ProductCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[3/4] bg-neutral-800 rounded-lg" />
    <div className="mt-3 space-y-2">
      <div className="h-4 bg-neutral-800 rounded w-3/4" />
      <div className="h-4 bg-neutral-800 rounded w-1/2" />
      <div className="h-5 bg-neutral-800 rounded w-1/3 mt-2" />
    </div>
  </div>
)

// Progressive reveal with staggered animation
const ProductGrid = ({ products }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {products.map((product, i) => (
      <motion.div
        key={product.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05, duration: 0.3 }}
      >
        <ProductCard product={product} />
      </motion.div>
    ))}
  </div>
)
```

**Skeleton Patterns by Page:**

| Page | Skeleton Structure |
|------|-------------------|
| Home | Hero block → Category cards → Product grid |
| Shop | Filter sidebar → Product grid (12 items) |
| Product | Image gallery (2:3) → Title/price blocks → Size buttons |
| Cart | Item rows → Summary box |
| Admin Dashboard | Stat cards → Table rows |

**Pro Tips:**
- Use `blur-up` for images: tiny blur placeholder → full image
- Pulse animation: `animate-pulse` with subtle neutral colors
- Match exact dimensions: prevents layout shift (CLS)
- Stagger animations: 50ms delay between items feels natural

---

### 3. Prefetching on User Intent

**Concept:** Predict what user will do next and load it before they ask. Hover, focus, and viewport proximity are intent signals.

**Implementation:**

```tsx
// Prefetch on hover (desktop) or touch start (mobile)
const ProductCard = ({ product }) => {
  const router = useRouter()
  const prefetchTimeout = useRef<NodeJS.Timeout>()
  
  const handleMouseEnter = () => {
    // Prefetch after 100ms hover (filters accidental hovers)
    prefetchTimeout.current = setTimeout(() => {
      router.prefetch(`/product/${product.slug}`)
    }, 100)
  }
  
  const handleMouseLeave = () => {
    clearTimeout(prefetchTimeout.current)
  }
  
  return (
    <Link
      href={`/product/${product.slug}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
    >
      <Card>...</Card>
    </Link>
  )
}

// Viewport-based prefetching
const useInViewPrefetch = (href: string) => {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          router.prefetch(href)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // Prefetch 200px before entering viewport
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [href, router])
  
  return ref
}
```

**Prefetch Strategy Matrix:**

| Intent Signal | What to Prefetch | When |
|--------------|------------------|------|
| Hover on product card | Product page data | After 100ms hover |
| Product card in viewport | Product page data | 200px before scroll |
| Hover on nav link | Target page data | Immediate |
| Cart button click | Checkout page | On mousedown |
| Search focus | Search results API | On focus |
| Category hover | Category products | After 150ms |

**Data Prefetching with React Query:**

```tsx
// Prefetch product data on hover
const queryClient = useQueryClient()

<ProductCard 
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['product', product.slug],
      queryFn: () => fetchProduct(product.slug),
      staleTime: 5 * 60 * 1000 // Cache for 5 min
    })
  }}
/>
```

---

### 4. Streaming with Progressive Hydration

**Concept:** Don't make users wait for the entire page. Stream content in chunks and hydrrate progressively.

**Implementation:**

```tsx
// App Router - Stream with Suspense
// app/shop/page.tsx
import { Suspense } from 'react'

export default function ShopPage() {
  return (
    <div>
      {/* Critical: Loads immediately */}
      <ShopHeader />
      <FilterBar />
      
      {/* Streams in when ready */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
      
      {/* Loads last, doesn't block */}
      <Suspense fallback={<NewsletterSkeleton />}>
        <Newsletter />
      </Suspense>
    </div>
  )
}

// Product Grid - Server Component
async function ProductGrid() {
  const products = await getProducts() // Streaming starts here
  
  return (
    <div className="grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

**Progressive Hydration Priority:**

| Priority | Component | Load Strategy |
|----------|-----------|---------------|
| 1 (Critical) | Header, Hero, Above-fold | Synchronous, block render |
| 2 (High) | Product grid, filters | Stream with Suspense |
| 3 (Medium) | Footer, newsletter | Lazy load, idle callback |
| 4 (Low) | Chat widget, modals | Client-only, load on interaction |

**Route Segment Config:**

```tsx
// Enable streaming with dynamic segments
export const dynamic = 'force-dynamic'
export const revalidate = 60 // ISR with 60s revalidation

// Or partial prerendering (Next.js 15+)
export const experimental_ppr = true
```

**Client-Side Progressive Hydration:**

```tsx
// Hydrate on interaction only
const HeavyChart = dynamic(
  () => import('./HeavyChart'),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

// Or use Intersection Observer
const HydrateOnView = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    })
    if (ref.current) observer.observe(ref.current)
  }, [])
  
  return <div ref={ref}>{isVisible ? children : <Skeleton />}</div>
}
```

---

### 5. Instant Feedback Micro-Interactions

**Concept:** Every user action should receive immediate visual acknowledgment. The feedback should be faster than the user can process (under 100ms).

**Implementation:**

```tsx
// Button with instant ripple feedback
const AddToCartButton = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 1. INSTANT ripple effect (visual feedback)
    const rect = e.currentTarget.getBoundingClientRect()
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    
    // 2. Instant state change
    setIsAdding(true)
    
    // 3. Then do the work
    addToCart(product)
    
    // 4. Clear ripple after animation
    setTimeout(() => {
      setRipple(null)
      setIsAdding(false)
    }, 600)
  }
  
  return (
    <button 
      onClick={handleClick}
      className="relative overflow-hidden transition-all duration-200"
    >
      {isAdding ? (
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4" /> Added!
        </span>
      ) : (
        'Add to Cart'
      )}
      
      {/* Ripple effect */}
      {ripple && (
        <motion.span
          className="absolute bg-white/30 rounded-full"
          style={{ left: ripple.x, top: ripple.y }}
          initial={{ width: 0, height: 0, x: '-50%', y: '-50%' }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </button>
  )
}
```

**Micro-Interaction Patterns:**

| Action | Instant Feedback | Duration |
|--------|------------------|----------|
| Button click | Scale down 95% + ripple | 150ms |
| Add to cart | Button text → "Added ✓" | 200ms |
| Hover card | Subtle lift + shadow | 200ms |
| Select size | Pulse + highlight ring | 150ms |
| Remove item | Fade out + collapse | 300ms |
| Filter change | Quick flash + load | 100ms |
| Form error | Shake + red border | 400ms |
| Success | Confetti/bounce | 600ms |

**Haptic Feedback (Mobile):**

```tsx
// Vibration API for instant tactile feedback
const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

// Usage
addToCart() // Light tap
vibrate(10) 

removeItem() // Double tap
vibrate([10, 30, 10])

error() // Warning buzz
vibrate([50, 20, 50])
```

**Loading State Guidelines:**

| Duration | What to Show |
|----------|-------------|
| 0-100ms | Nothing (action feels instant) |
| 100-300ms | Subtle spinner on button |
| 300-1000ms | Skeleton + progress indicator |
| 1000ms+ | Explicit loading state + cancel option |

---

## Background Jobs with Inngest

**Core Principle:** Heavy operations should never block the user. Fire events, let Inngest handle the rest.

### Event-Driven Architecture

```
User Action → Optimistic UI Update → Fire Inngest Event → Background Processing
```

### Key Events for Entities

```typescript
// src/inngest/events.ts
type Events = {
  // Cart events
  "cart/item.added": {
    data: { cartId: string; productId: string; variantId: string; quantity: number };
  };
  "cart/item.removed": {
    data: { cartId: string; variantId: string };
  };
  "cart/synced": {
    data: { cartId: string; itemCount: number };
  };

  // Order events
  "order/checkout.initiated": {
    data: { 
      orderId: string; 
      customerName: string; 
      whatsappNumber: string;
      items: Array<{ productId: string; variantId: string; quantity: number }>;
      total: number;
    };
  };
  "order/whatsapp.sent": {
    data: { orderId: string; messageSid: string };
  };
  "order/confirmed": {
    data: { orderId: string };
  };

  // Admin events
  "admin/product.created": {
    data: { productId: string; name: string };
  };
  "admin/bulk.upload.started": {
    data: { uploadId: string; itemCount: number };
  };
  "admin/analytics.refresh": {
    data: { period: "day" | "week" | "month" };
  };

  // Notification events
  "notification/email.send": {
    data: { to: string; template: string; data: Record<string, unknown> };
  };
  "notification/whatsapp.send": {
    data: { to: string; message: string };
  };
};
```

### Background Functions

```typescript
// src/inngest/functions/cart-sync.ts
export const syncCartToDatabase = inngest.createFunction(
  { id: "sync-cart-to-database" },
  { event: "cart/item.added" },
  async ({ event, step }) => {
    // Step 1: Validate inventory
    const inventory = await step.run("check-inventory", async () => {
      return supabase
        .from("product_variants")
        .select("stock")
        .eq("id", event.data.variantId)
        .single();
    });

    // Step 2: Sync to database
    await step.run("sync-item", async () => {
      return supabase.from("cart_items").upsert({
        cart_id: event.data.cartId,
        product_variant_id: event.data.variantId,
        quantity: event.data.quantity,
      });
    });

    // Step 3: Confirm sync
    await step.sendEvent("cart-synced", {
      name: "cart/synced",
      data: { cartId: event.data.cartId, itemCount: 1 },
    });
  }
);

// src/inngest/functions/order-processing.ts
export const processOrderCheckout = inngest.createFunction(
  { id: "process-order-checkout" },
  { event: "order/checkout.initiated" },
  async ({ event, step }) => {
    const { orderId, items, customerName, whatsappNumber, total } = event.data;

    // Step 1: Reserve inventory
    await step.run("reserve-inventory", async () => {
      const updates = items.map((item) =>
        supabase.rpc("decrement_stock", {
          variant_id: item.variantId,
          quantity: item.quantity,
        })
      );
      return Promise.all(updates);
    });

    // Step 2: Create order in database
    const order = await step.run("create-order", async () => {
      return supabase
        .from("orders")
        .insert({
          id: orderId,
          customer_name: customerName,
          whatsapp_number: whatsappNumber,
          total,
          status: "pending",
        })
        .select()
        .single();
    });

    // Step 3: Format WhatsApp message
    const message = await step.run("format-message", async () => {
      return formatOrderMessage(event.data);
    });

    // Step 4: Send WhatsApp notification
    const whatsappResult = await step.run("send-whatsapp", async () => {
      return sendWhatsAppMessage(whatsappNumber, message);
    });

    // Step 5: Log sent
    await step.sendEvent("whatsapp-sent", {
      name: "order/whatsapp.sent",
      data: { orderId, messageSid: whatsappResult.sid },
    });
  }
);

// src/inngest/functions/admin-bulk-upload.ts
export const processBulkUpload = inngest.createFunction(
  { id: "process-bulk-upload" },
  { event: "admin/bulk.upload.started" },
  async ({ event, step }) => {
    const { uploadId, itemCount } = event.data;

    // Process in chunks of 10 for parallel execution
    const chunks = chunkArray(items, 10);

    for (let i = 0; i < chunks.length; i++) {
      await Promise.all(
        chunks[i].map((item, j) =>
          step.run(`process-item-${i}-${j}`, async () => {
            return createProduct(item);
          })
        )
      );
    }

    // Send completion notification
    await step.run("notify-admin", async () => {
      return sendAdminNotification(`Bulk upload complete: ${itemCount} items`);
    });
  }
);
```

### Frontend Integration

```typescript
// Optimistic update with background sync
const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: async (item) => {
    const prevItems = get().items;

    // 1. INSTANT UI UPDATE
    set((state) => ({
      items: [...state.items, item],
      isAdding: true,
    }));

    // 2. Show success immediately
    toast.success(`Added ${item.name} to cart`);

    // 3. Fire background event (non-blocking)
    inngest.send({
      name: "cart/item.added",
      data: {
        cartId: getCartId(),
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      },
    });

    // 4. No await - user moves on, sync happens in background
    set({ isAdding: false });
  },

  // Revert on failure (listen to webhook or polling)
  handleSyncError: (error) => {
    set({ items: prevItems });
    toast.error("Sync failed. Retrying...");
  },
}));
```

### Order Checkout Flow

```typescript
// components/checkout/CheckoutForm.tsx
const handleSubmit = async (formData: CheckoutData) => {
  // 1. Generate order ID
  const orderId = `ENT-${Date.now()}`;

  // 2. Optimistic: Show success immediately
  setCheckoutStatus("processing");
  toast.loading("Preparing your order...");

  // 3. Fire event and let background handle everything
  await inngest.send({
    name: "order/checkout.initiated",
    data: {
      orderId,
      customerName: formData.name,
      whatsappNumber: formData.whatsapp,
      items: cart.items,
      total: cart.total,
    },
  });

  // 4. Redirect to success page (don't wait)
  router.push(`/checkout/success?orderId=${orderId}`);
};
```

### Background Jobs Map

| User Action | Instant UI | Background Job (Inngest) |
|------------|-----------|-------------------------|
| Add to cart | Item appears | Sync to DB, check inventory |
| Checkout | Success page | Create order, reserve stock, send WhatsApp |
| Apply discount | Price updates | Validate code, track usage |
| Admin bulk upload | Progress bar | Process items in parallel |
| Admin analytics | Cached data | Calculate fresh metrics |
| Newsletter signup | "Subscribed!" toast | Add to list, send welcome email |

### Reliability Features

```typescript
// Automatic retry with backoff
export const syncCartToDatabase = inngest.createFunction(
  {
    id: "sync-cart-to-database",
    retries: 3,
  },
  { event: "cart/item.added" },
  async ({ event, step }) => {
    // Retries automatically on failure
  }
);

// Failure handling
export const handleFailedOrders = inngest.createFunction(
  { id: "handle-failed-orders" },
  { event: "inngest/function.failed" },
  async ({ event, step }) => {
    if (event.data.function_id === "process-order-checkout") {
      await step.run("alert-team", async () => {
        return sendSlackAlert(`Order processing failed: ${event.data.run_id}`);
      });
    }
  }
);
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Set up Zustand with optimistic updates
- [ ] Create skeleton components for all pages
- [ ] Implement hover prefetching on product cards
- [ ] Install and configure Inngest SDK

### Phase 2: Background Jobs
- [ ] Set up Inngest client and types
- [ ] Create event schemas for all operations
- [ ] Implement cart sync background function
- [ ] Implement order processing function
- [ ] Set up WhatsApp messaging function

### Phase 3: Streaming
- [ ] Add Suspense boundaries around data-dependent components
- [ ] Configure route segments for optimal streaming
- [ ] Implement progressive hydration for heavy components

### Phase 4: Polish
- [ ] Add micro-interactions library (animations)
- [ ] Implement ripple effects on all interactive elements
- [ ] Add haptic feedback for mobile
- [ ] Create loading state guidelines for team
- [ ] Add failure handling functions

---

## Performance Budget

| Metric | Target | Why |
|--------|--------|-----|
| Time to First Byte | < 200ms | Server response |
| First Contentful Paint | < 1.0s | First visual feedback |
| Largest Contentful Paint | < 2.0s | Main content visible |
| Time to Interactive | < 3.0s | Page fully usable |
| Cumulative Layout Shift | < 0.1 | No jarring movements |
| First Input Delay | < 100ms | Instant interaction response |

## Perceived Performance Goals

| User Action | Perceived Response Time |
|-------------|------------------------|
| Click button | < 50ms (visual feedback) |
| Navigate page | < 200ms (loading state) |
| Search/filter | < 100ms (skeleton) |
| Add to cart | Instant (optimistic) |
| Form submit | < 100ms (validation) |

---

## Key Takeaways

1. **Optimistic Updates**: Act first, sync later. Revert only on failure.
2. **Skeleton Loading**: Show structure instantly, fill progressively.
3. **Intent Prefetching**: Load what user will want before they ask.
4. **Streaming**: Ship content in chunks, don't block for everything.
5. **Micro-Interactions**: Every click deserves instant acknowledgment.

> "Users don't notice speed. They notice waiting."
