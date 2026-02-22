import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { handlePrismaError } from "@/lib/errors";

export class CategoryService {
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      const { page = 1, limit = 20, search } = params;
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
      handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      return await prisma.category.findUnique({
        where: { id },
        include: {
          products: {
            take: 5,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              thumbnailUrl: true
            }
          }
        }
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: Prisma.CategoryCreateInput) {
    try {
      return await prisma.category.create({
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    try {
      return await prisma.category.update({
        where: { id },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const categoryService = new CategoryService();
