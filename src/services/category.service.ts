import type { Prisma } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class CategoryService {
  async findAll(
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const { search } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.CategoryWhereInput = {
        isActive: true,
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
      };

      const [data, total] = await Promise.all([
        prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy: { sortOrder: "asc" },
        }),
        prisma.category.count({ where }),
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
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          products: {
            take: 5,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              thumbnailUrl: true,
            },
          },
        },
      });
      if (!category) {
        throw new NotFoundError("Category", id);
      }
      return category;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.CategoryCreateInput) {
    try {
      return await prisma.category.create({
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    try {
      return await prisma.category.update({
        where: { id },
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const categoryService = new CategoryService();
