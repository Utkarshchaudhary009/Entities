import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { handlePrismaError, NotFoundError } from "@/lib/errors";

export class SizeService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 50 } = params;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.size.findMany({
          skip,
          take: limit,
          orderBy: { sortOrder: "asc" },
        }),
        prisma.size.count(),
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
      const size = await prisma.size.findUnique({ where: { id } });
      if (!size) throw new NotFoundError("Size", id);
      return size;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: Prisma.SizeCreateInput) {
    try {
      return await prisma.size.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.SizeUpdateInput) {
    try {
      return await prisma.size.update({ where: { id }, data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.size.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const sizeService = new SizeService();

