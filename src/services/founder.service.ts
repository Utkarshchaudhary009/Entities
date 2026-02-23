import type { Founder, Prisma } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class FounderService {
  async findAll(
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const { search } = params;
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
                logoUrl: true,
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
      return handlePrismaError(error);
    }
  }

  async findById(id: string): Promise<Founder> {
    try {
      const founder = await prisma.founder.findUnique({
        where: { id },
        include: {
          brand: true,
          socialLinks: { where: { isActive: true } },
        },
      });
      if (!founder) {
        throw new NotFoundError("Founder", id);
      }
      return founder;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.FounderCreateInput) {
    try {
      return await prisma.founder.create({
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.FounderUpdateInput) {
    try {
      return await prisma.founder.update({
        where: { id },
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.founder.delete({
        where: { id },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const founderService = new FounderService();
