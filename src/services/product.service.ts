import type { Prisma, Product } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class ProductService {
  async findAll(
    params: {
      page?: number;
      limit?: number;
      categoryId?: string;
      search?: string;
      sort?: string;
      includeInactive?: boolean;
    } = {},
  ) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const { categoryId, search, sort } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = {
        ...(params.includeInactive ? {} : { isActive: true }),
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
            isActive: true,
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
      return handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      const product = await prisma.product.findUnique({
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

              images: true,
              stock: true,
              sku: true,
            },
          },
        },
      });
      if (!product) throw new NotFoundError("Product", id);
      return product;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async findBySlug(slug: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
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

              images: true,
              stock: true,
              sku: true,
            },
          },
        },
      });
      if (!product) throw new NotFoundError("Product", slug);
      return product;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    try {
      return await prisma.product.create({
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    try {
      return await prisma.product.update({
        where: { id },
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<Product> {
    try {
      return await prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const productService = new ProductService();
