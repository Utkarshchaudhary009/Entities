import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// --- MOCK SETUP ---
mock.module("@/lib/auth/guards", () => ({
  requireAuth: mock(),
  requireAdmin: mock(),
}));

mock.module("@/services/product.service", () => ({
  productService: {
    findAll: mock(),
    create: mock(),
  },
}));

const { GET, POST } = await import("@/app/api/products/route");
const { requireAdmin } = await import("@/lib/auth/guards");
const { productService } = await import("@/services/product.service");

describe("API: Products", () => {
  beforeEach(() => {
    (requireAdmin as any).mockReset();
    (productService.findAll as any).mockReset();
    (productService.create as any).mockReset();
  });

  describe("GET", () => {
    it("should return products", async () => {
      // ARRANGE
      (productService.findAll as any).mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      // ACT
      const response = await GET(new Request("http://localhost/api/products"));

      // ASSERT
      expect(response.status).toBe(200);
    });
  });

  describe("POST", () => {
    it("should create product if admin", async () => {
      // ARRANGE
      (requireAdmin as any).mockResolvedValue({
        success: true,
        auth: { userId: "admin" },
      });
      (productService.create as any).mockResolvedValue({ id: "p1" });

      // ACT
      const request = new Request("http://localhost/api/products", {
        method: "POST",
        body: JSON.stringify({ name: "Shoe", slug: "shoe", price: 100 }),
      });
      const response = await POST(request);

      // ASSERT
      expect(response.status).toBe(201);
    });
  });
});
