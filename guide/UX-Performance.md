# UX Performance Guidelines - Entities

## Architectural Context
**Flow:** `DB -> Service -> API -> Store -> UI`

The UI **never** talks to the API directly. The UI **only** interacts with the Zustand Store. 
- **GET Operations:** Store fetches directly from the API.
- **POST/PUT/DELETE Operations:** Store fires Inngest events (which hit the API) while optimistically updating itself.

> "The fastest response is the one that never needs to wait. The UI must react to the Store instantly."

---

## 5 Core UX/UI Principles (Store-to-UI Layer)

### 1. Store-Driven Optimistic UI (Zero-Latency Actions)

**Concept:** The UI triggers a Store action. The Store instantly updates its local state (e.g., adding a temporary item with a generated ID) and notifies the UI. *Only then* does the Store handle the network request (via Inngest/API).

**Implementation:**

```tsx
// src/stores/ui-store.ts
import { create } from 'zustand'
import { toast } from 'sonner'
import { inngest } from '@/inngest/client'

export const useBrandStore = create<BrandStore>((set, get) => ({
  brands: [],
  isAdding: false,
  
  addBrand: async (brandData) => {
    // 1. Store updates ITSELF instantly
    const tempId = `temp-${Date.now()}`
    const optimisticBrand = { ...brandData, id: tempId }
    
    set((state) => ({
      brands: [optimisticBrand, ...state.brands],
      isAdding: true
    }))
    
    // 2. Immediate UI feedback via Store-driven toast
    toast.success(`Creating Brand: ${brandData.name}`)
    
    try {
      // 3. Store triggers background network action (Inngest -> API)
      await inngest.send({
        name: "entity/brand.created",
        data: { ...brandData, id: tempId } // Temp ID swapped on server response usually
      })
      // (Optionally: listen to a websocket or SSE to swap temp ID with real DB ID)
    } catch (error) {
      // 4. Store handles rollback silently; UI just reacts
      set((state) => ({
        brands: state.brands.filter(b => b.id !== tempId)
      }))
      toast.error('Failed to create brand. Reverted.')
    } finally {
      set({ isAdding: false })
    }
  }
}))
```

**UI Layer Responsibility:** The UI has zero `try/catch` logic. It simply calls `addBrand(data)` and renders the `brands` array.

---

### 2. Granular Loading States in Store

**Concept:** Never use page-blocking global loaders. The Store must expose highly granular loading fields (e.g., `isAddingItem`, `deletingId: string | null`). The UI binds exactly to these states to trigger scoped `tw-animate-css` skeletons or micro-spinners locally.

**Implementation (Store):**
```tsx
  brandsLoading: boolean,
  deletingBrandId: string | null,
```

**Implementation (UI):**
```tsx
// UI Layer - Reacting to granular store states
import { useBrandStore } from '@/stores/ui-store'
import { Loader2 } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'

const BrandRow = ({ brand }) => {
  const deleteBrand = useBrandStore(s => s.deleteBrand)
  const deletingBrandId = useBrandStore(s => s.deletingBrandId)

  const isDeleting = deletingBrandId === brand.id

  return (
    <div className={`flex justify-between p-4 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      <span>{brand.name}</span>
      <Button 
        variant="destructive" 
        size="sm"
        onClick={() => deleteBrand(brand.id)}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
      </Button>
    </div>
  )
}
```

---

### 3. Store-Mediated Prefetching

**Concept:** UI intent signals (hover, focus) trigger the Store to prefetch data. The Store checks its cache before hitting the API, ensuring the UI sees instant content on the actual click.

**Implementation:**

```tsx
// Store Layer
export const useBrandStore = create<BrandStore>((set, get) => ({
  brandDetailsCache: {},
  
  prefetchBrand: async (id: string) => {
    if (get().brandDetailsCache[id]) return // Already cached
    
    // Fetch directly from API
    const res = await fetch(`/api/brands/${id}`)
    const data = await res.json()
    
    set(state => ({
      brandDetailsCache: { ...state.brandDetailsCache, [id]: data }
    }))
  }
}))

// UI Layer
const BrandCard = ({ brand }) => {
  const prefetchBrand = useBrandStore(s => s.prefetchBrand)
  
  return (
    <Link 
      href={`/admin/brands/${brand.id}`}
      onMouseEnter={() => prefetchBrand(brand.id)}
      className="block p-4 border rounded hover:border-blue-500 transition-colors"
    >
      {brand.name}
    </Link>
  )
}
```

---

### 4. Resilient Error Rollbacks (Store Controlled)

**Concept:** The UI is "dumb" to network errors. If an API request (via Inngest or direct fetch) fails, the Store internalizes the `catch` block, undoes the optimistic state, and surfaces a generic notification. The UI doesn't break, jump, or show raw stack traces.

**Implementation Rule:**
Every store action that manipulates state must capture the `previousState` before proceeding, strictly using Zustand's `get()` to capture it, and reverting if `fetch` fails.

---

### 5. State-Synced Micro-Interactions

**Concept:** Micro-interactions (like a button scaling down on click) are strictly synced to the Store's synchronous actions. 

**Implementation Framework:**
- **Store starts action:** UI immediately reflects `disabled` or spinning state (under 100ms).
- **CSS utility:** Use `active:scale-95 transition-transform` on all actionable elements.
- **Skeletons:** If the Store is loading initial list data (`brandsLoading: true`), the UI renders exact-dimension `animate-pulse` skeletons (via `tw-animate-css`) rather than empty white space.

```tsx
// Exact-dimension skeleton bound to store state
const BrandGrid = () => {
  const { brands, brandsLoading } = useBrandStore()

  if (brandsLoading) return (
    <div className="grid grid-cols-3 gap-4">
       {[1,2,3].map(i => (
         <div key={i} className="h-32 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
       ))}
    </div>
  )

  return <Grid data={brands} />
}
```

---

## Implementation Checklist

- [ ] All UI components are entirely decoupled from `fetch` or `inngest.send`.
- [ ] Zustand stores manage all `isLoading`, `isAdding`, `isDeleting` states granularly.
- [ ] Optimistic inserts/updates occur synchronously within the Store action before network calls.
- [ ] Hover/Focus events in the UI trigger `.prefetch()` actions in the Store.
- [ ] Buttons use `tw-animate-css` utilities (e.g., `active:scale-95`) for hardware-accelerated click feedback. 

> "The UI asks the Store. The Store handles the rest."
