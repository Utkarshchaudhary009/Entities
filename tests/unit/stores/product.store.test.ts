import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { useProductStore } from "@/stores/product.store";

// --- MOCK SETUP ---
mock.module("@/stores/http", () => ({
  createRequestDeduper: () => (key: string, fn: any) => fn(),
  fetchApi: mock(),
  fetchJson: mock(),
  buildSearchParams: () => new URLSearchParams(),
  coercePaginatedResponse: (json: any) => ({ data: json, meta: { total: 1 } }),
  unwrapApiPayload: (json: any) => json,
}));

const { fetchApi, fetchJson } = await import("@/stores/http");

describe("ProductStore", () => {
  beforeEach(() => {
    useProductStore.setState({
      products: [],
      product: null,
      variants: [],
      isLoading: false,
      error: null,
    });
    (fetchApi as any).mockReset();
    (fetchJson as any).mockReset();
  });

  describe("createProduct", () => {
    it("should optimistically add product", async () => {
      // ARRANGE
      const input = { name: "Shoe", price: 100, slug: "shoe" };
      const serverResponse = { id: "p1", ...input };
      (fetchApi as any).mockResolvedValue(serverResponse);

      // ACT
      const promise = useProductStore.getState().createProduct(input);

      // ASSERT (Optimistic)
      expect(useProductStore.getState().products).toHaveLength(1);

      await promise;

      // ASSERT (Final)
      expect(useProductStore.getState().products[0].id).toBe("p1");
    });
  });

  describe("createVariant", () => {
    it("should optimistically add variant", async () => {
      // ARRANGE
      const input = {
        productId: "123e4567-e89b-12d3-a456-426614174000",
        size: "M",
        color: "Red",
      };
      const serverResponse = { id: "v1", ...input };
      (fetchApi as any).mockResolvedValue(serverResponse);

      // ACT
      const promise = useProductStore.getState().createVariant(input);

      // ASSERT (Optimistic)
      expect(useProductStore.getState().variants).toHaveLength(1);

      await promise;

      // ASSERT (Final)
      expect(useProductStore.getState().variants[0].id).toBe("v1");
    });
  });
});
