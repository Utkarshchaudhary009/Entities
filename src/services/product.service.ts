import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { handlePrismaError } from "@/lib/errors";

export class ProductService {
  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    sort?: string;
  }) {
    try {
      const { page = 1, limit = 20, categoryId, search, sort } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = {
        isActive: true,
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const orderBy: Prisma.ProductOrderByWithRelationInput = {};
      if (sort === "price_asc") orderBy.price = "asc";
      else if (sort === "price_desc") orderBy.price = "desc";
      else if (sort === "oldest") orderBy.createdAt = "asc";
      else orderBy.createdAt = "desc";

      const [data, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            thumbnailUrl: true,
            categoryId: true,
            isFeatured: true,
            createdAt: true,
            defaultColor: true,
            defaultSize: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.product.count({ where }),
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
      return await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              size: true,
              color: true,
              colorHex: true,
              images: true,
              stock: true,
              sku: true,
            },
          },
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: Prisma.ProductCreateInput) {
    try {
      return await prisma.product.create({
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    try {
      return await prisma.product.update({
        where: { id },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const productService = new ProductService();
