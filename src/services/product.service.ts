import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export class ProductService {
  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    sort?: string;
  }) {
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
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: {
            select: {
                id: true,
                name: true,
                slug: true
            }
        },
        variants: {
            where: { isActive: true },
            select: {
                id: true,
                size: true,
                color: true,
                stock: true,
                sku: true
            }
        }
      },
    });
  }

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }
}

export const productService = new ProductService();
