import type { Prisma } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class BrandService {
  async findAll(
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const { search } = params;
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
                thumbnailUrl: true,
              },
            },
            documents: {
              where: { isActive: true },
              select: {
                id: true,
                type: true,
              },
            },
            socialLinks: {
              where: { isActive: true },
              select: {
                id: true,
                platform: true,
                url: true,
              },
            },
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
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      const brand = await prisma.brand.findUnique({
        where: { id },
        include: {
          founder: true,
          documents: { where: { isActive: true } },
          socialLinks: { where: { isActive: true } },
        },
      });
      if (!brand) {
        throw new NotFoundError("Brand", id);
      }
      return brand;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.BrandUncheckedCreateInput) {
    try {
      return await prisma.brand.create({
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.BrandUncheckedUpdateInput) {
    try {
      return await prisma.brand.update({
        where: { id },
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.brand.delete({
        where: { id },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const brandService = new BrandService();
