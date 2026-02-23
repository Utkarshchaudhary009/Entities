import type { Prisma } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class DiscountService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
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
      return handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      const discount = await prisma.discount.findUnique({ where: { id } });
      if (!discount) throw new NotFoundError("Discount", id);
      return discount;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.DiscountUncheckedCreateInput) {
    try {
      return await prisma.discount.create({ data });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.DiscountUncheckedUpdateInput) {
    try {
      return await prisma.discount.update({ where: { id }, data });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.discount.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const discountService = new DiscountService();
