import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

mock.restore();

// --- MOCK SETUP ---
mock.module("next/cache", () => ({
  revalidatePath: mock(),
  revalidateTag: mock(),
}));

mock.module("@/lib/auth/guards", () => ({
  requireAuth: mock(),
  requireAdmin: mock(),
}));

mock.module("@/services/brand.service", () => ({
  brandService: {
    findAll: mock(),
    create: mock(),
  },
}));

mock.module("@/inngest/safe-send", () => ({
  safeInngestSend: mock(),
}));

const { GET, POST } = await import("@/app/api/brands/route");
const { requireAdmin } = await import("@/lib/auth/guards");
const { brandService } = await import("@/services/brand.service");

afterAll(() => {
  mock.restore();
});

describe("API: Brands", () => {
  beforeEach(() => {
    (requireAdmin as ReturnType<typeof mock>).mockReset();
    (brandService.findAll as ReturnType<typeof mock>).mockReset();
    (brandService.create as ReturnType<typeof mock>).mockReset();
  });

  describe("GET", () => {
    it("should return brands", async () => {
      // ARRANGE
      (brandService.findAll as ReturnType<typeof mock>).mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      // ACT
      const response = await GET(new Request("http://localhost/api/brands"));
      const json = await response.json();

      // ASSERT
      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });
  });

  describe("POST", () => {
    it("should create brand if admin", async () => {
      // ARRANGE
      (requireAdmin as ReturnType<typeof mock>).mockResolvedValue({
        success: true,
        auth: { userId: "admin" },
      });
      (brandService.create as ReturnType<typeof mock>).mockResolvedValue({
        id: "b1",
        name: "Nike",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      });

      // ACT
      const request = new Request("http://localhost/api/brands", {
        method: "POST",
        body: JSON.stringify({
          name: "Nike",
          founderId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      });
      const response = await POST(request);
      const json = await response.json();

      // ASSERT
      expect(response.status).toBe(201);
      expect(json.data.id).toBe("b1");
    });
  });
});
