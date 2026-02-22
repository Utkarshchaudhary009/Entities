import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export class CategoryService {
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
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
  }

  async findById(id: string) {
    return prisma.category.findUnique({
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
  }

  async create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({
      data,
    });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryService = new CategoryService();
