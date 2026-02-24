import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

mock.restore();

mock.module("@/lib/api/response", () => ({
  successDataResponse: (data: unknown) =>
    Response.json(
      {
        data,
      },
      { status: 200 },
    ),
  handleError: () =>
    Response.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 },
    ),
}));

mock.module("@/lib/auth/guards", () => ({
  requireAdmin: mock(),
}));

mock.module("@/services/admin-dashboard.service", () => ({
  adminDashboardService: {
    getOverview: mock(),
  },
}));

const { GET } = await import("@/app/api/admin/dashboard/route");
const { requireAdmin } = await import("@/lib/auth/guards");
const { adminDashboardService } = await import("@/services/admin-dashboard.service");

afterAll(() => {
  mock.restore();
});

describe("API: Admin Dashboard", () => {
  beforeEach(() => {
    (requireAdmin as any).mockReset();
    (adminDashboardService.getOverview as any).mockReset();
  });

  it("returns 200 with overview when admin is authorized", async () => {
    (requireAdmin as any).mockResolvedValue({
      success: true,
      auth: { userId: "admin_1", role: "ADMIN" },
    });

    (adminDashboardService.getOverview as any).mockResolvedValue({
      totalOrders: 1,
      totalRevenue: 100,
      pendingOrders: 1,
      lowStockVariants: 2,
      activeDiscounts: 1,
      recentOrders: [],
      statusBreakdown: [],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.totalRevenue).toBe(100);
    expect(adminDashboardService.getOverview).toHaveBeenCalledTimes(1);
  });

  it("returns guard response when user is not admin", async () => {
    (requireAdmin as any).mockResolvedValue({
      success: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      }),
    });

    const response = await GET();

    expect(response.status).toBe(403);
    expect(adminDashboardService.getOverview).not.toHaveBeenCalled();
  });
});
