import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from "bun:test";

mock.restore();

// --- MOCK SETUP ---
mock.module("@/lib/auth/guards", () => ({
  requireAuth: mock(),
  requireAdmin: mock(),
}));

mock.module("@/services/discount.service", () => ({
  discountService: {
    findAll: mock(),
    create: mock(),
  },
}));

const { GET, POST } = await import("@/app/api/discounts/route");
const { requireAdmin } = await import("@/lib/auth/guards");
const { discountService } = await import("@/services/discount.service");

afterAll(() => {
  mock.restore();
});

describe("API: Discounts", () => {
  beforeEach(() => {
    (requireAdmin as any).mockReset();
    (discountService.findAll as any).mockReset();
    (discountService.create as any).mockReset();
  });

  describe("GET", () => {
    it("should return discounts if admin", async () => {
      // ARRANGE
      (requireAdmin as any).mockResolvedValue({ success: true });
      (discountService.findAll as any).mockResolvedValue({ data: [] });

      // ACT
      const response = await GET(new Request("http://localhost/api/discounts"));

      // ASSERT
      expect(response.status).toBe(200);
    });
  });

  describe("POST", () => {
    it("should create discount if admin", async () => {
      // ARRANGE
      (requireAdmin as any).mockResolvedValue({ success: true });
      (discountService.create as any).mockResolvedValue({ id: "d1" });

      // ACT
      const request = new Request("http://localhost/api/discounts", {
        method: "POST",
        body: JSON.stringify({
          code: "SALE",
          value: 10,
          discountType: "PERCENTAGE",
        }),
      });
      const response = await POST(request);

      // ASSERT
      expect(response.status).toBe(201);
    });
  });
});
