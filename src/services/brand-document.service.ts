import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export class BrandDocumentService {
  async findAll(params: {
    page?: number;
    limit?: number;
    brandId?: string;
    type?: string;
  }) {
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
  }

  async findById(id: string) {
    return prisma.brandDocument.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.BrandDocumentCreateInput) {
    return prisma.brandDocument.create({
      data,
    });
  }

  async update(id: string, data: Prisma.BrandDocumentUpdateInput) {
    return prisma.brandDocument.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.brandDocument.delete({
      where: { id },
    });
  }
}

export const brandDocumentService = new BrandDocumentService();
