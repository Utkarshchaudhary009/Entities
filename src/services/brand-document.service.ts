import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { handlePrismaError } from "@/lib/errors";

export class BrandDocumentService {
  async findAll(params: {
    page?: number;
    limit?: number;
    brandId?: string;
    type?: string;
  }) {
    try {
      const { page = 1, limit = 20, brandId, type } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.BrandDocumentWhereInput = {
        isActive: true,
        ...(brandId && { brandId }),
        ...(type && { type: type as Prisma.EnumDocumentTypeFilter }),
      };

      const [data, total] = await Promise.all([
        prisma.brandDocument.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.brandDocument.count({ where }),
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
      return await prisma.brandDocument.findUnique({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: Prisma.BrandDocumentCreateInput) {
    try {
      return await prisma.brandDocument.create({
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.BrandDocumentUpdateInput) {
    try {
      return await prisma.brandDocument.update({
        where: { id },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.brandDocument.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const brandDocumentService = new BrandDocumentService();
