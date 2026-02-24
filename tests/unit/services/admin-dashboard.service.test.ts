import { beforeEach, describe, expect, it, mock } from "bun:test";
import { setupServiceModule } from "./service-test.utils";

mock.module("@/lib/errors", () => ({
  handlePrismaError: (error: unknown) => {
    throw error;
  },
}));

const mockPrisma = {
  order: {
    count: mock(),
    aggregate: mock(),
    findMany: mock(),
    groupBy: mock(),
  },
  productVariant: {
    count: mock(),
  },
  discount: {
    count: mock(),
  },
};

const { adminDashboardService } = await setupServiceModule<
  typeof import("@/services/admin-dashboard.service")
>({
  serviceSourcePath: "../../../src/services/admin-dashboard.service",
  prismaMock: mockPrisma,
});

describe("AdminDashboardService", () => {
  beforeEach(() => {
    mockPrisma.order.count.mockReset();
    mockPrisma.order.aggregate.mockReset();
    mockPrisma.order.findMany.mockReset();
    mockPrisma.order.groupBy.mockReset();
    mockPrisma.productVariant.count.mockReset();
    mockPrisma.discount.count.mockReset();
  });

  it("returns aggregated overview payload", async () => {
    mockPrisma.order.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(4);
    mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 98765 } });
    mockPrisma.productVariant.count.mockResolvedValue(3);
    mockPrisma.discount.count.mockResolvedValue(2);
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: "ord_1",
        orderNumber: "ORD-1",
        customerName: "Ada",
        total: 4500,
        status: "PENDING",
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    ]);
    mockPrisma.order.groupBy.mockResolvedValue([
      { status: "PENDING", _count: { status: 4 } },
      { status: "DELIVERED", _count: { status: 8 } },
    ]);

    const result = await adminDashboardService.getOverview();

    expect(result).toEqual({
      totalOrders: 12,
      totalRevenue: 98765,
      pendingOrders: 4,
      lowStockVariants: 3,
      activeDiscounts: 2,
      recentOrders: [
        {
          id: "ord_1",
          orderNumber: "ORD-1",
          customerName: "Ada",
          total: 4500,
          status: "PENDING",
          createdAt: "2026-01-01T10:00:00.000Z",
        },
      ],
      statusBreakdown: [
        { status: "PENDING", count: 4 },
        { status: "DELIVERED", count: 8 },
      ],
    });
  });

  it("falls back to zero revenue when aggregate sum is null", async () => {
    mockPrisma.order.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: null } });
    mockPrisma.productVariant.count.mockResolvedValue(0);
    mockPrisma.discount.count.mockResolvedValue(0);
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.order.groupBy.mockResolvedValue([]);

    const result = await adminDashboardService.getOverview();

    expect(result.totalRevenue).toBe(0);
    expect(result.recentOrders).toEqual([]);
    expect(result.statusBreakdown).toEqual([]);
  });
});
