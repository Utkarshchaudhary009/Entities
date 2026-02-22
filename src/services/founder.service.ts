import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export class FounderService {
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.FounderWhereInput = {
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.founder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            brand: {
                select: {
                    id: true,
                    name: true,
                    logoUrl: true
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
        }
      }),
      prisma.founder.count({ where }),
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
    return prisma.founder.findUnique({
      where: { id },
      include: {
        brand: true,
        socialLinks: { where: { isActive: true } }
      },
    });
  }

  async create(data: Prisma.FounderCreateInput) {
    return prisma.founder.create({
      data,
    });
  }

  async update(id: string, data: Prisma.FounderUpdateInput) {
    return prisma.founder.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.founder.delete({
      where: { id },
    });
  }
}

export const founderService = new FounderService();
