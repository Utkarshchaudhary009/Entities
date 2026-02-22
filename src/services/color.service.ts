import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { handlePrismaError, NotFoundError } from "@/lib/errors";

export class ColorService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 50 } = params;
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
      handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      const color = await prisma.color.findUnique({ where: { id } });
      if (!color) throw new NotFoundError("Color", id);
      return color;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: Prisma.ColorCreateInput) {
    try {
      return await prisma.color.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.ColorUpdateInput) {
    try {
      return await prisma.color.update({ where: { id }, data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.color.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const colorService = new ColorService();

