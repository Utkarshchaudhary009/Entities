/**
 * Cart store with optimistic updates
 */
import { create } from "zustand";

export interface CartItem {
  id: string;
  productVariantId: string;
  quantity: number;
  productName: string;
  productPrice: number;
  productImage: string | null;
  size: string;
  color: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;

  setSessionId: (sessionId: string) => void;
  setItems: (items: CartItem[]) => void;

  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  syncWithServer: () => Promise<void>;

  clearError: () => void;
}

const generateOptimisticId = () => `optimistic-${Date.now()}`;

function withSessionId(path: string, sessionId: string) {
  const url = new URL(path, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  url.searchParams.set("sessionId", sessionId);
  return url.pathname + url.search;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  sessionId: null,

  setSessionId: (sessionId) => set({ sessionId }),

  setItems: (items) => set({ items, error: null }),

  addItem: async (item) => {
    const { sessionId } = get();
    if (!sessionId) return;

    const previousItems = get().items;
    const items = previousItems;

    const existingIndex = items.findIndex(
      (i) => i.productVariantId === item.productVariantId,
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + item.quantity,
      };
      set({ items: newItems });
    } else {
      const optimisticItem: CartItem = {
        ...item,
        id: generateOptimisticId(),
      };
      set({ items: [...items, optimisticItem] });
    }

    try {
      set({ isLoading: true });
      const response = await fetch(withSessionId("/api/cart", sessionId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        }),
      });

      if (!response.ok) {
        set({ items: previousItems, error: "Failed to add item to cart" });
        return;
      }

      await get().syncWithServer();
    } catch {
      set({ items: previousItems, error: "Failed to add item to cart" });
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (variantId, quantity) => {
    const previousItems = get().items;
    const items = previousItems;

    if (quantity <= 0) {
      set({ items: items.filter((i) => i.productVariantId !== variantId) });
    } else {
      set({
        items: items.map((i) =>
          i.productVariantId === variantId ? { ...i, quantity } : i,
        ),
      });
    }

    try {
      set({ isLoading: true });
      const item = items.find((i) => i.productVariantId === variantId);
      if (!item) return;

      const response = await fetch(`/api/cart/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        set({ items: previousItems, error: "Failed to update quantity" });
        return;
      }

      await get().syncWithServer();
    } catch {
      set({ items: previousItems, error: "Failed to update quantity" });
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (variantId) => {
    const previousItems = get().items;
    const item = previousItems.find((i) => i.productVariantId === variantId);

    set({
      items: previousItems.filter((i) => i.productVariantId !== variantId),
    });

    try {
      set({ isLoading: true });
      if (!item) return;

      const response = await fetch(`/api/cart/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        set({ items: previousItems, error: "Failed to remove item" });
        return;
      }
    } catch {
      set({ items: previousItems, error: "Failed to remove item" });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    const previousItems = get().items;

    set({ items: [] });

    try {
      set({ isLoading: true });
      const response = await fetch(withSessionId("/api/cart", sessionId), {
        method: "DELETE",
      });

      if (!response.ok) {
        set({ items: previousItems, error: "Failed to clear cart" });
        return;
      }
    } catch {
      set({ items: previousItems, error: "Failed to clear cart" });
    } finally {
      set({ isLoading: false });
    }
  },

  syncWithServer: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      const response = await fetch(withSessionId("/api/cart", sessionId));
      if (response.ok) {
        const data = await response.json();
        set({ items: data.items || [], error: null });
      }
    } catch {
      set({ error: "Failed to sync cart" });
    }
  },

  clearError: () => set({ error: null }),
}));

export const useCartItems = () => useCartStore((state) => state.items);
export const useCartIsLoading = () => useCartStore((state) => state.isLoading);
export const useCartError = () => useCartStore((state) => state.error);
export const useCartTotal = () =>
  useCartStore((state) =>
    state.items.reduce(
      (total, item) => total + item.productPrice * item.quantity,
      0,
    ),
  );
export const useCartCount = () =>
  useCartStore((state) =>
    state.items.reduce((count, item) => count + item.quantity, 0),
  );
