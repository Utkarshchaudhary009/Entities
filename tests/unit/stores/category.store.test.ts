import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { useCategoryStore } from "@/stores/category.store";

// --- MOCK SETUP ---
mock.module("@/stores/http", () => ({
  createRequestDeduper: () => (key: string, fn: any) => fn(),
  fetchApi: mock(),
  fetchJson: mock(),
  buildSearchParams: () => new URLSearchParams(),
  coercePaginatedResponse: (json: any) => ({ data: json, meta: { total: 1 } }),
}));

const { fetchApi } = await import("@/stores/http");

describe("CategoryStore (Factory)", () => {
  beforeEach(() => {
    useCategoryStore.setState({
      items: [],
      selectedItem: null,
      isLoading: false,
      error: null,
    });
    (fetchApi as any).mockReset();
  });

  describe("create", () => {
    it("should optimistically create category", async () => {
      // ARRANGE
      const input = { name: "Tops", slug: "tops" };
      const serverResponse = { id: "c1", ...input };
      (fetchApi as any).mockResolvedValue(serverResponse);

      // ACT
      const promise = useCategoryStore.getState().create(input);

      // ASSERT (Optimistic)
      expect(useCategoryStore.getState().items).toHaveLength(1);

      await promise;

      // ASSERT (Final)
      expect(useCategoryStore.getState().items[0].id).toBe("c1");
    });
  });
});
