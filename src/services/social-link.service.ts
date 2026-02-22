import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { handlePrismaError } from "@/lib/errors";

export class SocialLinkService {
  async findAll(params: {
    page?: number;
    limit?: number;
    brandId?: string;
    founderId?: string;
    platform?: string;
  }) {
    try {
      const { page = 1, limit = 20, brandId, founderId, platform } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.SocialLinkWhereInput = {
        isActive: true,
        ...(brandId && { brandId }),
        ...(founderId && { founderId }),
        ...(platform && { platform: { contains: platform, mode: "insensitive" } }),
      };

      const [data, total] = await Promise.all([
        prisma.socialLink.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.socialLink.count({ where }),
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
      return await prisma.socialLink.findUnique({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: Prisma.SocialLinkCreateInput) {
    try {
      return await prisma.socialLink.create({
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.SocialLinkUpdateInput) {
    try {
      return await prisma.socialLink.update({
        where: { id },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.socialLink.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const socialLinkService = new SocialLinkService();
