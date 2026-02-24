import { handlePrismaError } from "@/lib/errors";
import prisma from "@/lib/prisma";
import type { AdminDashboardOverview } from "@/types/api";

const LOW_STOCK_THRESHOLD = 5;
const RECENT_ORDERS_LIMIT = 6;

export class AdminDashboardService {
  async getOverview(): Promise<AdminDashboardOverview> {
    try {
      const [
        totalOrders,
        pendingOrders,
        revenueAggregate,
        lowStockVariants,
        activeDiscounts,
        recentOrders,
        statusBreakdown,
      ] = await Promise.all([
        prisma.order.count({ where: { deletedAt: null } }),
        prisma.order.count({ where: { deletedAt: null, status: "PENDING" } }),
        prisma.order.aggregate({
          where: { deletedAt: null },
          _sum: { total: true },
        }),
        prisma.productVariant.count({
          where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        }),
        prisma.discount.count({ where: { isActive: true } }),
        prisma.order.findMany({
          where: { deletedAt: null },
          take: RECENT_ORDERS_LIMIT,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            total: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.order.groupBy({
          by: ["status"],
          where: { deletedAt: null },
          _count: { status: true },
        }),
      ]);

      return {
        totalOrders,
        totalRevenue: revenueAggregate._sum.total ?? 0,
        pendingOrders,
        lowStockVariants,
        activeDiscounts,
        recentOrders: recentOrders.map((order) => ({
          ...order,
          createdAt: order.createdAt.toISOString(),
        })),
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      };
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
