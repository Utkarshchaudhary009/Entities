import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export class BrandService {
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.BrandWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { tagline: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: limit,
        include: {
          founder: {
            select: {
              id: true,
              name: true,
              thumbnailUrl: true
            }
          },
          documents: {
            where: { isActive: true },
            select: {
              id: true,
              type: true
            }
          },
          socialLinks: {
            where: { isActive: true },
            select: {
              id: true,
              platform: true,
              url: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.brand.count({ where }),
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
    return prisma.brand.findUnique({
      where: { id },
      include: {
        founder: true,
        documents: { where: { isActive: true } },
        socialLinks: { where: { isActive: true } }
      },
    });
  }

  async create(data: Prisma.BrandCreateInput) {
    return prisma.brand.create({
      data,
    });
  }

  async update(id: string, data: Prisma.BrandUpdateInput) {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.brand.delete({
      where: { id },
    });
  }
}

export const brandService = new BrandService();
