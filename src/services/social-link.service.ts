import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export class SocialLinkService {
  async findAll(params: {
    page?: number;
    limit?: number;
    brandId?: string;
    founderId?: string;
    platform?: string;
  }) {
    const { page = 1, limit = 20, brandId, founderId, platform } = params;
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
  }

  async findById(id: string) {
    return prisma.socialLink.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.SocialLinkCreateInput) {
    return prisma.socialLink.create({
      data,
    });
  }

  async update(id: string, data: Prisma.SocialLinkUpdateInput) {
    return prisma.socialLink.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.socialLink.delete({
      where: { id },
    });
  }
}

export const socialLinkService = new SocialLinkService();
