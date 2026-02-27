"use client";

/**
 * Cart store with optimistic updates
 */
import { create } from "zustand";
import type {
  CartItem as DbCartItem,
  Product,
  ProductVariant,
} from "@/generated/prisma/client";
import { createRequestDeduper, fetchApi } from "@/stores/http";
import type { CartItemWithDetails } from "@/types/domain";

type CartSummaryItem = Omit<CartItemWithDetails, "cartId">;

type CartItemApi = DbCartItem & {
  productVariant: ProductVariant & {
    product: Pick<Product, "name" | "price" | "thumbnailUrl">;
  };
};

interface CartSummaryApi {
  items: CartSummaryItem[];
  subtotal: number;
  itemCount: number;
}

interface CartState {
  items: CartSummaryItem[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;

  setSessionId: (sessionId: string) => void;
  setItems: (items: CartSummaryItem[]) => void;

  addItem: (item: Omit<CartSummaryItem, "id" | "subtotal">) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  syncWithServer: () => Promise<void>;

  clearError: () => void;
}

function generateOptimisticId() {
  return `temp_${crypto.randomUUID()}`;
}

function isOptimisticId(id: string) {
  return id.startsWith("temp_");
}

function toCartSummaryItem(api: CartItemApi): CartSummaryItem {
  return {
    id: api.id,
    productVariantId: api.productVariantId,
    quantity: api.quantity,
    productName: api.productVariant.product.name,
    productPrice: api.productVariant.product.price,
    productImage: api.productVariant.product.thumbnailUrl,
    size: api.productVariant.size,
    color: api.productVariant.color,
    stock: api.productVariant.stock,
    subtotal: api.productVariant.product.price * api.quantity,
  };
}

async function fetchCartJson<T>(
  sessionId: string,
  input: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("x-session-id", sessionId);
  return fetchApi<T>(input, { ...init, headers });
}

export const useCartStore = create<CartState>((set, get) => {
  const dedupe = createRequestDeduper();

  return {
    items: [],
    isLoading: false,
    error: null,
    sessionId: null,

    setSessionId: (sessionId) => set({ sessionId }),

    setItems: (items) => set({ items, error: null }),

    addItem: async (item) => {
      console.log(`[CartStore] addItem() initiated`, { item });
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
          subtotal:
            newItems[existingIndex].productPrice *
            (newItems[existingIndex].quantity + item.quantity),
        };
        set({ items: newItems });
      } else {
        const optimisticItem: CartSummaryItem = {
          ...item,
          id: generateOptimisticId(),
          subtotal: item.productPrice * item.quantity,
        };
        set({ items: [...items, optimisticItem] });
      }

      try {
        set({ isLoading: true });
        const cartItem = await fetchCartJson<CartItemApi>(
          sessionId,
          "/api/cart",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
            }),
          },
        );
        const reconciled = toCartSummaryItem(cartItem);
        set((state) => ({
          items: state.items.map((i) =>
            i.productVariantId === reconciled.productVariantId ? reconciled : i,
          ),
          error: null,
        }));
      } catch (err) {
        set({ items: previousItems, error: "Failed to add item to cart" });
        console.error(
          `[CartStore] addItem() FAILED. Reverting cart size to ${previousItems.length}. Error:`,
          err,
        );
      } finally {
        set({ isLoading: false });
      }
    },

    updateQuantity: async (variantId, quantity) => {
      console.log(`[CartStore] updateQuantity() initiated`, {
        variantId,
        quantity,
      });
      const { sessionId } = get();
      if (!sessionId) return;

      if (quantity <= 0) {
        await get().removeItem(variantId);
        return;
      }

      const previousItems = get().items;
      set({
        items: previousItems.map((i) =>
          i.productVariantId === variantId
            ? { ...i, quantity, subtotal: i.productPrice * quantity }
            : i,
        ),
      });

      try {
        set({ isLoading: true });
        let item = get().items.find((i) => i.productVariantId === variantId);
        if (!item) return;

        if (isOptimisticId(item.id)) {
          await get().syncWithServer();
          item = get().items.find((i) => i.productVariantId === variantId);
          if (!item || isOptimisticId(item.id)) return;
        }

        await fetchCartJson<unknown>(sessionId, `/api/cart/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
      } catch (err) {
        set({ items: previousItems, error: "Failed to update quantity" });
        console.error(
          `[CartStore] updateQuantity() FAILED. Reverted optimistic quantity update. Error:`,
          err,
        );
      } finally {
        set({ isLoading: false });
      }
    },

    removeItem: async (variantId) => {
      console.log(`[CartStore] removeItem() initiated`, { variantId });
      const { sessionId } = get();
      if (!sessionId) return;

      const previousItems = get().items;
      const item = previousItems.find((i) => i.productVariantId === variantId);

      set({
        items: previousItems.filter((i) => i.productVariantId !== variantId),
      });

      try {
        set({ isLoading: true });
        if (!item) return;
        if (isOptimisticId(item.id)) return;

        await fetchCartJson<unknown>(sessionId, `/api/cart/${item.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        set({ items: previousItems, error: "Failed to remove item" });
        console.error(
          `[CartStore] removeItem() FAILED. Reverting item removal, cart size back to ${previousItems.length}. Error:`,
          err,
        );
      } finally {
        set({ isLoading: false });
      }
    },

    clearCart: async () => {
      console.log(`[CartStore] clearCart() initiated`);
      const { sessionId } = get();
      if (!sessionId) return;

      const previousItems = get().items;

      set({ items: [] });

      try {
        set({ isLoading: true });
        await fetchCartJson<unknown>(sessionId, "/api/cart", {
          method: "DELETE",
        });
      } catch (err) {
        set({ items: previousItems, error: "Failed to clear cart" });
        console.error(
          `[CartStore] clearCart() FAILED. Restoring ${previousItems.length} items to cart. Error:`,
          err,
        );
      } finally {
        set({ isLoading: false });
      }
    },

    syncWithServer: async () => {
      console.log(`[CartStore] syncWithServer() initiated`);
      const { sessionId } = get();
      if (!sessionId) return;

      try {
        await dedupe(`GET:/api/cart:${sessionId}`, async () => {
          const summary = await fetchCartJson<CartSummaryApi>(
            sessionId,
            "/api/cart",
          );
          set({ items: summary.items ?? [], error: null });
        });
      } catch (err) {
        set({ error: "Failed to sync cart" });
        console.error(`[CartStore] syncWithServer() FAILED. Error:`, err);
      }
    },

    clearError: () => set({ error: null }),
  };
});

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
