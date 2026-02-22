import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export class OrderService {
  async findAll(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            items: true
        }
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true
      },
    });
  }

  async create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: { items: true }
    });
  }
}

export const orderService = new OrderService();
