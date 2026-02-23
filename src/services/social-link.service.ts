import type { Prisma, SocialLink } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class SocialLinkService {
  async findAll(
    params: {
      page?: number;
      limit?: number;
      brandId?: string;
      founderId?: string;
      platform?: string;
    } = {},
  ) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const { brandId, founderId, platform } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.SocialLinkWhereInput = {
        isActive: true,
        ...(brandId && { brandId }),
        ...(founderId && { founderId }),
        ...(platform && {
          platform: { contains: platform, mode: "insensitive" },
        }),
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
      return handlePrismaError(error);
    }
  }

  async findById(id: string): Promise<SocialLink> {
    try {
      const socialLink = await prisma.socialLink.findUnique({
        where: { id },
      });
      if (!socialLink) {
        throw new NotFoundError("SocialLink", id);
      }
      return socialLink;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.SocialLinkCreateInput) {
    try {
      return await prisma.socialLink.create({
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.SocialLinkUpdateInput) {
    try {
      return await prisma.socialLink.update({
        where: { id },
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.socialLink.delete({
        where: { id },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const socialLinkService = new SocialLinkService();
