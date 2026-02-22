import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { handlePrismaError, NotFoundError } from "@/lib/errors";

export class DiscountService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 50 } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.DiscountWhereInput = {
        isActive: true,
      };

      const [data, total] = await Promise.all([
        prisma.discount.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.discount.count({ where }),
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
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      const discount = await prisma.discount.findUnique({ where: { id } });
      if (!discount) throw new NotFoundError("Discount", id);
      return discount;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: Prisma.DiscountCreateInput) {
    try {
      return await prisma.discount.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.DiscountUpdateInput) {
    try {
      return await prisma.discount.update({ where: { id }, data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.discount.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const discountService = new DiscountService();

