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
// Mock guards
mock.module("@/lib/auth/guards", () => ({
  requireAuth: mock(),
  requireAdmin: mock(),
}));

// Mock service
mock.module("@/services/order.service", () => ({
  orderService: {
    findById: mock(),
    findByIdWithOwnership: mock(),
    updateOrderDetails: mock(),
    softDelete: mock(),
  },
}));

// Mock Inngest (safeSend)
mock.module("@/inngest/safe-send", () => ({
  safeInngestSend: mock(),
}));

// Import implementations
const { GET, PUT } = await import("@/app/api/orders/[id]/route");
const { requireAuth, requireAdmin } = await import("@/lib/auth/guards");
const { orderService } = await import("@/services/order.service");

afterAll(() => {
  mock.restore();
});

describe("API: Orders [id]", () => {
  const VALID_ID = "550e8400-e29b-41d4-a716-446655440000";
  const mockParams = Promise.resolve({ id: VALID_ID });

  beforeEach(() => {
    (requireAuth as any).mockReset();
    (requireAdmin as any).mockReset();
    (orderService.findById as any).mockReset();
    (orderService.updateOrderDetails as any).mockReset();
  });

  describe("GET", () => {
    it("should return order for owner", async () => {
      // ARRANGE
      (requireAuth as any).mockResolvedValue({
        success: true,
        auth: { userId: "user_1", role: "USER" },
      });
      (orderService.findByIdWithOwnership as any).mockResolvedValue({
        id: VALID_ID,
      });

      // ACT
      const request = new Request(`http://localhost/api/orders/${VALID_ID}`);
      const response = await GET(request, { params: mockParams });
      const json = await response.json();

      // ASSERT
      expect(response.status).toBe(200);
      expect(json.data.id).toBe(VALID_ID);
      expect(orderService.findByIdWithOwnership).toHaveBeenCalledWith(
        VALID_ID,
        "user_1",
      );
    });

    it("should return 401 if not authenticated", async () => {
      // ARRANGE
      (requireAuth as any).mockResolvedValue({
        success: false,
        response: new Response(null, { status: 401 }),
      });

      // ACT
      const request = new Request(`http://localhost/api/orders/${VALID_ID}`);
      const response = await GET(request, { params: mockParams });

      // ASSERT
      expect(response.status).toBe(401);
      expect(orderService.findById).not.toHaveBeenCalled();
    });
  });

  describe("PUT (Status Update)", () => {
    it("should update status if admin", async () => {
      // ARRANGE
      (requireAdmin as any).mockResolvedValue({
        success: true,
        auth: { userId: "admin_1" },
      });
      (orderService.findById as any).mockResolvedValue({
        id: VALID_ID,
        status: "PENDING",
        orderNumber: "ORD-1",
      });
      (orderService.updateOrderDetails as any).mockResolvedValue({
        id: VALID_ID,
        status: "SHIPPED",
      });

      // ACT
      const request = new Request(`http://localhost/api/orders/${VALID_ID}`, {
        method: "PUT",
        body: JSON.stringify({ status: "SHIPPED" }),
      });
      const response = await PUT(request, { params: mockParams });
      const json = await response.json();

      // ASSERT
      expect(response.status).toBe(200);
      expect(json.data.status).toBe("SHIPPED");
      expect(orderService.updateOrderDetails).toHaveBeenCalledWith(
        VALID_ID,
        { status: "SHIPPED", adminNotes: undefined },
      );
    });
  });
});
