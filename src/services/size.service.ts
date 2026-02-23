import type { Prisma } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class SizeService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
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
      return handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      const size = await prisma.size.findUnique({ where: { id } });
      if (!size) throw new NotFoundError("Size", id);
      return size;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.SizeCreateInput) {
    try {
      return await prisma.size.create({ data });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.SizeUpdateInput) {
    try {
      return await prisma.size.update({ where: { id }, data });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.size.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const sizeService = new SizeService();
