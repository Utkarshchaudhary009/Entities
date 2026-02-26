# MASTER PLAN: Navigation + User Profile System

## Overview
Build a responsive navigation system (top navbar for desktop, bottom navbar for mobile) and a comprehensive user profile page with addresses and notification preferences.

---

**Branch**: `feat/navigation-profile`

---

## Architecture: Store → API → Inngest Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              UI LAYER                                   │
│  User clicks "Add Address" → Store instantly updates UI (optimistic)    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ZUSTAND STORE                                 │
│  1. Generate tempId + optimistic item                                   │
│  2. Update items[] immediately (UI reflects change)                     │
│  3. Call API endpoint                                                   │
│  4. On success: replace tempId with real id                             │
│  5. On failure: rollback + show toast                                   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API ROUTE                                    │
│  1. Validate request (Zod)                                              │
│  2. Write to DB (Prisma) — fast, synchronous                            │
│  3. Fire Inngest event (non-blocking via safeInngestSend)               │
│  4. Return response to store                                            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         INNGEST (Background)                            │
│  Heavy async work:                                                      │
│  - Send notification emails                                             │
│  - Audit logging                                                        │
│  - Sync to external services                                            │
│  - Analytics tracking                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Principles:**
1. **DB writes happen in API** — fast, synchronous, returns immediately
2. **Inngest handles side-effects** — emails, notifications, logging (non-blocking)
3. **Store does optimistic UI** — instant feedback, rollback on error
4. **Use existing patterns** — `createEntityStore`, `safeInngestSend`

---

## Phase 1: Foundation (Database + Backend)
> **Goal**: Build the data layer so UI has something to connect to.

### 1.1 Prisma Schema
- [ ] Add `UserAddress` model
  ```prisma
  model UserAddress {
    id        String   @id @default(uuid())
    clerkId   String   @map("clerk_id")
    label     String   @default("Home") // Home, Work, Other
    name      String
    phone     String
    address   String
    city      String
    state     String
    pincode   String
    isDefault Boolean  @default(false) @map("is_default")
    createdAt DateTime @default(now()) @map("created_at")
    updatedAt DateTime @updatedAt @map("updated_at")

    @@index([clerkId])
    @@map("user_addresses")
  }
  ```

- [ ] Add `UserPreference` model
  ```prisma
  model UserPreference {
    id           String   @id @default(uuid())
    clerkId      String   @unique @map("clerk_id")
    notifyPush   Boolean  @default(true) @map("notify_push")
    notifyEmail  Boolean  @default(true) @map("notify_email")
    notifySms    Boolean  @default(false) @map("notify_sms")
    notifyInApp  Boolean  @default(true) @map("notify_in_app")
    createdAt    DateTime @default(now()) @map("created_at")
    updatedAt    DateTime @updatedAt @map("updated_at")

    @@map("user_preferences")
  }
  ```

- [ ] Run `bunx prisma migrate dev --name add_user_profile_tables`

### 1.2 Services
- [ ] Create `src/services/user-address.service.ts`
  - `getAddresses(clerkId)`
  - `getAddress(id, clerkId)`
  - `createAddress(clerkId, data)`
  - `updateAddress(id, clerkId, data)`
  - `deleteAddress(id, clerkId)`
  - `setDefaultAddress(id, clerkId)`

- [ ] Create `src/services/user-preference.service.ts`
  - `getPreferences(clerkId)` — returns preferences or creates default
  - `updatePreferences(clerkId, data)`

### 1.3 API Routes
- [ ] `src/app/api/user/addresses/route.ts` — GET (list), POST (create)
- [ ] `src/app/api/user/addresses/[id]/route.ts` — GET, PATCH, DELETE
- [ ] `src/app/api/user/addresses/[id]/default/route.ts` — PATCH (set default)
- [ ] `src/app/api/user/preferences/route.ts` — GET, PATCH

### 1.4 Inngest Events & Functions

#### Add Events to `src/inngest/client.ts`
- [ ] Add to `EntityEvents` type:
  ```ts
  // User Address Events
  "user/address.created.v1": {
    data: {
      id: string;
      clerkId: string;
      label: string;
      name: string;
      city: string;
      isDefault: boolean;
      idempotencyKey: string;
    };
  };
  "user/address.updated.v1": {
    data: {
      id: string;
      clerkId: string;
      changes: Record<string, unknown>;
      idempotencyKey: string;
    };
  };
  "user/address.deleted.v1": {
    data: {
      id: string;
      clerkId: string;
      idempotencyKey: string;
    };
  };
  "user/address.default-changed.v1": {
    data: {
      id: string;
      clerkId: string;
      previousDefaultId?: string;
      idempotencyKey: string;
    };
  };

  // User Preferences Events
  "user/preferences.updated.v1": {
    data: {
      clerkId: string;
      changes: {
        notifyPush?: boolean;
        notifyEmail?: boolean;
        notifySms?: boolean;
        notifyInApp?: boolean;
      };
      idempotencyKey: string;
    };
  };
  ```

#### Create Inngest Functions `src/inngest/functions/user-profile.ts`
- [ ] `userAddressCreated` — Log audit, welcome email for first address
- [ ] `userAddressUpdated` — Log audit
- [ ] `userAddressDeleted` — Log audit
- [ ] `userPreferencesUpdated` — Handle notification preference changes (e.g., unsubscribe from email service)

#### API → Inngest Integration Pattern
```ts
// In API route (e.g., POST /api/user/addresses)
import { safeInngestSend } from "@/inngest/safe-send";

// After DB write succeeds:
safeInngestSend({
  name: "user/address.created.v1",
  data: {
    id: address.id,
    clerkId: address.clerkId,
    label: address.label,
    name: address.name,
    city: address.city,
    isDefault: address.isDefault,
    idempotencyKey: crypto.randomUUID(),
  },
});
// Don't await — fire and forget
```

### 1.5 Zustand Stores (with granular loading states)
- [ ] Create `src/stores/user-address.store.ts`
  - State: `addresses`, `isLoading`, `isAdding`, `updatingId`, `deletingId`, `settingDefaultId`
  - Actions: `fetchAddresses`, `addAddress`, `updateAddress`, `deleteAddress`, `setDefault`
  - Optimistic UI with rollback
  - **Pattern**:
    ```ts
    addAddress: async (data) => {
      const tempId = crypto.randomUUID();
      const optimistic = { ...data, id: tempId, createdAt: new Date(), updatedAt: new Date() };
      const prev = get().addresses;
      
      set({ addresses: [optimistic, ...prev], isAdding: true });
      
      try {
        const real = await fetchApi<UserAddress>("/api/user/addresses", {
          method: "POST",
          body: JSON.stringify(data),
        });
        set((s) => ({
          addresses: s.addresses.map((a) => (a.id === tempId ? real : a)),
          isAdding: false,
        }));
        return real;
      } catch (err) {
        set({ addresses: prev, isAdding: false });
        toast.error("Failed to add address");
      }
    },
    ```

- [ ] Create `src/stores/user-preference.store.ts`
  - State: `preferences`, `isLoading`, `savingField` (tracks which toggle is saving)
  - Actions: `fetchPreferences`, `updatePreference(field, value)`
  - **Pattern for instant toggle**:
    ```ts
    updatePreference: async (field, value) => {
      const prev = get().preferences;
      if (!prev) return;
      
      // Optimistic
      set({ preferences: { ...prev, [field]: value }, savingField: field });
      
      try {
        await fetchApi("/api/user/preferences", {
          method: "PATCH",
          body: JSON.stringify({ [field]: value }),
        });
        set({ savingField: null });
      } catch {
        set({ preferences: prev, savingField: null });
        toast.error("Failed to update preference");
      }
    },
    ```

---

## Phase 2: Navigation System
> **Goal**: Create responsive navigation that works on all devices.

### 2.1 Shared Components
- [ ] Create `src/components/layout/nav-items.ts` — Centralized nav config
  ```ts
  export const NAV_ITEMS = [
    { href: "/", label: "Home", icon: Home01Icon },
    { href: "/shop", label: "Shop", icon: Store01Icon },
    { href: "/cart", label: "Cart", icon: ShoppingCart01Icon },
    { href: "/profile", label: "Profile", icon: null }, // Uses UserAvatar
  ] as const;
  ```

- [ ] Create `src/components/layout/nav-link.tsx` — Reusable link with active state

### 2.2 Desktop: Refactor Topbar
- [ ] Update `src/components/layout/topbar.tsx`
  - Keep sticky header with logo
  - Replace center nav with icon + label links
  - Show nav links with active indicator
  - UserAvatar for profile (no text)
  - Hide on mobile (`hidden md:flex`)
  - Remove hamburger for public routes (keep for admin)

### 2.3 Mobile: Bottom Navbar
- [ ] Create `src/components/layout/bottom-nav.tsx`
  - Fixed bottom bar (`fixed bottom-0 inset-x-0`)
  - 4 icons: Home, Shop, Cart (with badge), Profile (UserAvatar)
  - Active state indicator
  - Safe area padding for notch devices
  - Show only on mobile (`md:hidden`)
  - Hide on admin routes

### 2.4 Cart Badge
- [ ] Update cart store to expose `itemCount`
- [ ] Show badge on cart icon in both navbars

### 2.5 Layout Integration
- [ ] Update root layout to include `<BottomNav />`
- [ ] Add `pb-16 md:pb-0` to main content for bottom nav spacing

---

## Phase 3: Profile Page
> **Goal**: Build a beautiful, functional profile page.

### 3.1 Profile Layout
- [ ] Create `src/app/(shop)/profile/layout.tsx`
  - Responsive container
  - Back button on mobile

### 3.2 Main Profile Page
- [ ] Create `src/app/(shop)/profile/page.tsx`
  ```
  ┌─────────────────────────────────────┐
  │  [Avatar]  Name                     │  Hero Card
  │  email@example.com    [Edit →]      │
  ├─────────────────────────────────────┤
  │  🌓 Theme Toggle (Dark/Light)       │  Below hero
  ├─────────────────────────────────────┤
  │  📦 My Orders                    →  │
  │  🎟️ My Coupons                   →  │
  │  📍 Addresses                    →  │  Menu Items
  │  🔔 Notifications                →  │
  │  📄 Legal & Policies             →  │
  │  🆘 Help & Support               →  │
  ├─────────────────────────────────────┤
  │  [Logout]                           │  Danger Zone
  └─────────────────────────────────────┘
  ```

### 3.3 Sub-Pages
- [ ] `src/app/(shop)/profile/orders/page.tsx`
  - List orders from existing `orders` table
  - Order cards with status badge
  - Link to order detail

- [ ] `src/app/(shop)/profile/coupons/page.tsx`
  - Show available/used coupons
  - Copy code functionality

- [ ] `src/app/(shop)/profile/addresses/page.tsx`
  - List addresses with default badge
  - Add/Edit/Delete with Sheet/Dialog
  - Set default action

- [ ] `src/app/(shop)/profile/notifications/page.tsx`
  - Toggle switches for each notification type
  - Instant optimistic updates
  - Grouped by category

- [ ] `src/app/(shop)/profile/legal/page.tsx`
  - Links to policy documents
  - Fetch from `brand_documents` table

- [ ] `src/app/(shop)/profile/support/page.tsx`
  - FAQ accordion
  - Contact info from Brand
  - WhatsApp link

### 3.4 Components
- [ ] `src/components/profile/profile-hero.tsx` — Avatar + name card
- [ ] `src/components/profile/profile-menu-item.tsx` — Reusable menu row
- [ ] `src/components/profile/address-card.tsx` — Address display
- [ ] `src/components/profile/address-form.tsx` — Add/Edit form
- [ ] `src/components/profile/notification-toggle.tsx` — Toggle with label

---

## File Structure (Final)

```
src/
├── app/
│   ├── api/user/
│   │   ├── addresses/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── default/route.ts
│   │   └── preferences/
│   │       └── route.ts
│   └── (shop)/profile/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── orders/page.tsx
│       ├── coupons/page.tsx
│       ├── addresses/page.tsx
│       ├── notifications/page.tsx
│       ├── legal/page.tsx
│       └── support/page.tsx
├── components/
│   ├── layout/
│   │   ├── topbar.tsx (updated)
│   │   ├── bottom-nav.tsx (new)
│   │   ├── nav-items.ts (new)
│   │   └── nav-link.tsx (new)
│   └── profile/
│       ├── profile-hero.tsx
│       ├── profile-menu-item.tsx
│       ├── address-card.tsx
│       ├── address-form.tsx
│       └── notification-toggle.tsx
├── services/
│   ├── user-address.service.ts (new)
│   └── user-preference.service.ts (new)
└── stores/
    ├── user-address.store.ts (new)
    └── user-preference.store.ts (new)
```

---

## Execution Order

| Step | Task | Depends On |
|------|------|------------|
| 1 | Prisma models + migrate | — |
| 2 | Services | Step 1 |
| 3 | API routes | Step 2 |
| 4 | Zustand stores | Step 3 |
| 5 | Nav items config | — |
| 6 | Refactor Topbar | Step 5 |
| 7 | Bottom Nav | Step 5 |
| 8 | Layout integration | Steps 6, 7 |
| 9 | Profile page + hero | Step 4 |
| 10 | Profile sub-pages | Step 9 |
| 11 | Polish + test | All |

---

## Notes
- Theme stored in localStorage (next-themes), no DB needed
- Admin button stays in topbar for admin users
- Cart badge uses existing cart store
- Legal docs fetched from existing `brand_documents` table
- Orders use existing `orders` table
