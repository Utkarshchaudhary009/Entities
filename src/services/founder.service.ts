import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { handlePrismaError } from "@/lib/errors";

export class FounderService {
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
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
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      return await prisma.founder.findUnique({
        where: { id },
        include: {
          brand: true,
          socialLinks: { where: { isActive: true } }
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: Prisma.FounderCreateInput) {
    try {
      return await prisma.founder.create({
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.FounderUpdateInput) {
    try {
      return await prisma.founder.update({
        where: { id },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.founder.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const founderService = new FounderService();
