import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

mock.restore();

// --- MOCK SETUP ---
mock.module("next/headers", () => ({
  headers: () => new Map([["x-session-id", "sess_1"]]),
}));

mock.module("@/lib/auth/guards", () => ({
  requireAuth: mock(() =>
    Promise.resolve({ success: true, auth: { userId: "user_1" } }),
  ),
}));

mock.module("@/services/cart.service", () => ({
  cartService: {
    getCartSummary: mock(),
    addItem: mock(),
    clearCart: mock(),
  },
}));

const { GET, POST } = await import("@/app/api/cart/route");
const { cartService } = await import("@/services/cart.service");

afterAll(() => {
  mock.restore();
});

describe("API: Cart", () => {
  beforeEach(() => {
    (cartService.getCartSummary as ReturnType<typeof mock>).mockReset();
    (cartService.addItem as ReturnType<typeof mock>).mockReset();
    (cartService.clearCart as ReturnType<typeof mock>).mockReset();
  });

  describe("GET", () => {
    it("should return cart summary", async () => {
      // ARRANGE
      (cartService.getCartSummary as ReturnType<typeof mock>).mockResolvedValue(
        { items: [] },
      );
      const request = new Request("http://localhost/api/cart", {
        headers: { "x-session-id": "sess_1" },
      });

      // ACT
      const response = await GET(request);
      const json = await response.json();

      // ASSERT
      expect(response.status).toBe(200);
      expect(json.data).toEqual({ items: [] });
    });
  });

  describe("POST", () => {
    it("should add item to cart", async () => {
      // ARRANGE
      (cartService.addItem as ReturnType<typeof mock>).mockResolvedValue({
        id: "i1",
      });
      const request = new Request("http://localhost/api/cart", {
        method: "POST",
        headers: { "x-session-id": "sess_1" },
        body: JSON.stringify({
          productVariantId: "550e8400-e29b-41d4-a716-446655440000",
          quantity: 1,
        }),
      });

      // ACT
      const response = await POST(request);

      // ASSERT
      expect(response.status).toBe(201);
    });
  });
});
