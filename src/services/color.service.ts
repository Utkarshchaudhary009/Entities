import type { Prisma } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class ColorService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.color.findMany({
          skip,
          take: limit,
          orderBy: { sortOrder: "asc" },
        }),
        prisma.color.count(),
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
      const color = await prisma.color.findUnique({ where: { id } });
      if (!color) throw new NotFoundError("Color", id);
      return color;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.ColorCreateInput) {
    try {
      return await prisma.color.create({ data });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.ColorUpdateInput) {
    try {
      return await prisma.color.update({ where: { id }, data });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.color.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const colorService = new ColorService();
