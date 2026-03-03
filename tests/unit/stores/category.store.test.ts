import { beforeEach, describe, expect, it, mock } from "bun:test";
import { useCategoryStore } from "@/stores/category.store";

// --- MOCK SETUP ---
mock.module("@/stores/http", () => ({
  createRequestDeduper: () => (_key: string, fn: () => void | Promise<void>) =>
    fn(),
  fetchApi: mock(),
  fetchJson: mock(),
  buildSearchParams: () => new URLSearchParams(),
  coercePaginatedResponse: (json: unknown) => ({
    data: json,
    meta: { total: 1 },
  }),
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
    (fetchApi as ReturnType<typeof mock>).mockReset();
  });

  describe("create", () => {
    it("should optimistically create category", async () => {
      // ARRANGE
      const input = { name: "Tops", slug: "tops" };
      const serverResponse = { id: "c1", ...input };
      (fetchApi as ReturnType<typeof mock>).mockResolvedValue(serverResponse);

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
