import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { useBrandStore } from "@/stores/brand.store";

// --- MOCK SETUP ---
mock.module("@/stores/http", () => ({
  createRequestDeduper: () => (key: string, fn: any) => fn(),
  fetchApi: mock(),
  fetchJson: mock(),
}));

const { fetchApi, fetchJson } = await import("@/stores/http");

describe("BrandStore", () => {
  beforeEach(() => {
    useBrandStore.setState({
      brands: [],
      brand: null,
      isLoading: false,
      error: null,
    });
    (fetchApi as any).mockReset();
    (fetchJson as any).mockReset();
  });

  describe("createBrand", () => {
    it("should optimistically add brand and sync", async () => {
      // ARRANGE
      const input = {
        name: "Nike",
        founderId: "123e4567-e89b-12d3-a456-426614174000",
      };
      const serverResponse = { id: "server_id", name: "Nike" };
      (fetchApi as any).mockResolvedValue(serverResponse);

      // ACT
      const promise = useBrandStore.getState().createBrand(input);

      // ASSERT (Optimistic)
      const stateOpt = useBrandStore.getState();
      expect(stateOpt.brands).toHaveLength(1);
      expect(stateOpt.brands[0].name).toBe("Nike");

      await promise;

      // ASSERT (Final)
      const stateFinal = useBrandStore.getState();
      expect(stateFinal.brands[0].id).toBe("server_id");
    });

    it("should revert on failure", async () => {
      // ARRANGE
      (fetchApi as any).mockRejectedValue(new Error("Fail"));

      // ACT
      await useBrandStore.getState().createBrand({
        name: "Nike",
        founderId: "123e4567-e89b-12d3-a456-426614174000",
      });

      // ASSERT
      expect(useBrandStore.getState().brands).toHaveLength(0);
      expect(useBrandStore.getState().error).toBe("Fail");
    });
  });

  describe("updateBrand", () => {
    it("should optimistically update", async () => {
      // ARRANGE
      useBrandStore.setState({
        brands: [{ id: "1", name: "Nike" } as any],
        brand: { id: "1", name: "Nike" } as any,
      });
      (fetchApi as any).mockResolvedValue({ id: "1", name: "Nike Updated" });

      // ACT
      await useBrandStore.getState().updateBrand("1", { name: "Nike Updated" });

      // ASSERT
      const state = useBrandStore.getState();
      expect(state.brand?.name).toBe("Nike Updated");
      expect(state.brands[0].name).toBe("Nike Updated");
    });
  });

  describe("deleteBrand", () => {
    it("should optimistically delete", async () => {
      // ARRANGE
      useBrandStore.setState({
        brands: [{ id: "1", name: "Nike" } as any],
      });
      (fetchJson as any).mockResolvedValue({});

      // ACT
      await useBrandStore.getState().deleteBrand("1");

      // ASSERT
      expect(useBrandStore.getState().brands).toHaveLength(0);
    });
  });
});
