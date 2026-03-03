import { beforeEach, describe, expect, it, mock } from "bun:test";
import { useCartStore } from "@/stores/cart.store";

// --- MOCK SETUP ---
// Mock the fetchApi function from "@/stores/http"
mock.module("@/stores/http", () => ({
  createRequestDeduper: () => (_key: string, fn: () => void | Promise<void>) =>
    fn(),
  fetchApi: mock(),
}));

const { fetchApi } = await import("@/stores/http");

describe("CartStore", () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      isLoading: false,
      error: null,
      sessionId: "sess_123",
    });
    (fetchApi as ReturnType<typeof mock>).mockReset();
  });

  describe("addItem", () => {
    it("should optimistically add item and sync with server", async () => {
      // ARRANGE
      const itemToAdd = {
        productVariantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 1,
        productName: "Shoe",
        productPrice: 100,
        productImage: "img.jpg",
        size: "M",
        color: "Red",
        stock: 10,
      };

      const serverResponse = {
        id: "server_id_1",
        productVariantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 1,
        productVariant: {
          size: "M",
          color: "Red",
          stock: 10,
          product: {
            name: "Shoe",
            price: 100,
            thumbnailUrl: "img.jpg",
          },
        },
      };

      (fetchApi as ReturnType<typeof mock>).mockResolvedValue(serverResponse);

      // ACT
      const promise = useCartStore.getState().addItem(itemToAdd);

      // ASSERT (Optimistic State)
      const stateOptimistic = useCartStore.getState();
      expect(stateOptimistic.items).toHaveLength(1);
      expect(stateOptimistic.items[0].id).toContain("temp_");
      expect(stateOptimistic.isLoading).toBe(true);

      await promise;

      // ASSERT (Final State)
      const stateFinal = useCartStore.getState();
      expect(stateFinal.items).toHaveLength(1);
      expect(stateFinal.items[0].id).toBe("server_id_1"); // ID replaced
      expect(stateFinal.isLoading).toBe(false);
      expect(fetchApi).toHaveBeenCalledTimes(1);
    });

    it("should revert state on API failure", async () => {
      // ARRANGE
      const itemToAdd = {
        productVariantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 1,
        productName: "Shoe",
        productPrice: 100,
        productImage: "img.jpg",
        size: "M",
        color: "Red",
        stock: 10,
      };

      (fetchApi as ReturnType<typeof mock>).mockRejectedValue(
        new Error("API Error"),
      );

      // ACT
      await useCartStore.getState().addItem(itemToAdd);

      // ASSERT
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0); // Reverted
      expect(state.error).toBe("Failed to add item to cart");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("removeItem", () => {
    it("should optimistically remove item", async () => {
      // ARRANGE
      useCartStore.setState({
        items: [
          {
            id: "i1",
            productVariantId: "123e4567-e89b-12d3-a456-426614174000",
            quantity: 1,
            productName: "Shoe",
            productPrice: 100,
            productImage: "img.jpg",
            size: "M",
            color: "Red",
            stock: 10,
            subtotal: 100,
          },
        ],
      });

      (fetchApi as ReturnType<typeof mock>).mockResolvedValue({});

      // ACT
      const promise = useCartStore
        .getState()
        .removeItem("123e4567-e89b-12d3-a456-426614174000");

      // ASSERT (Optimistic)
      const stateOptimistic = useCartStore.getState();
      expect(stateOptimistic.items).toHaveLength(0);

      await promise;

      // ASSERT (Final)
      const stateFinal = useCartStore.getState();
      expect(stateFinal.items).toHaveLength(0);
      expect(fetchApi).toHaveBeenCalledWith(
        expect.stringContaining("/api/cart/i1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("updateQuantity", () => {
    it("should optimistically update quantity", async () => {
      // ARRANGE
      useCartStore.setState({
        items: [
          {
            id: "i1",
            productVariantId: "123e4567-e89b-12d3-a456-426614174000",
            quantity: 1,
            productName: "Shoe",
            productPrice: 100,
            productImage: "img.jpg",
            size: "M",
            color: "Red",
            stock: 10,
            subtotal: 100,
          },
        ],
      });

      (fetchApi as ReturnType<typeof mock>).mockResolvedValue({});

      // ACT
      const promise = useCartStore
        .getState()
        .updateQuantity("123e4567-e89b-12d3-a456-426614174000", 2);

      // ASSERT (Optimistic)
      const stateOptimistic = useCartStore.getState();
      expect(stateOptimistic.items[0].quantity).toBe(2);
      expect(stateOptimistic.items[0].subtotal).toBe(200);

      await promise;

      expect(fetchApi).toHaveBeenCalledWith(
        expect.stringContaining("/api/cart/i1"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ quantity: 2 }),
        }),
      );
    });
  });
});
