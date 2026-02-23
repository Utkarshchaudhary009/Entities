import type { BrandDocument, Prisma } from "@/generated/prisma/client";
import type { DocumentType } from "@/generated/prisma/enums";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class BrandDocumentService {
  async findAll(
    params: {
      page?: number;
      limit?: number;
      brandId?: string;
      type?: string;
    } = {},
  ) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const { brandId, type } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.BrandDocumentWhereInput = {
        isActive: true,
        ...(brandId && { brandId }),
        ...(type && { type: type as DocumentType }),
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
      return handlePrismaError(error);
    }
  }

  async findById(id: string): Promise<BrandDocument> {
    try {
      const document = await prisma.brandDocument.findUnique({
        where: { id },
      });
      if (!document) {
        throw new NotFoundError("BrandDocument", id);
      }
      return document;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.BrandDocumentCreateInput) {
    try {
      return await prisma.brandDocument.create({
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.BrandDocumentUpdateInput) {
    try {
      return await prisma.brandDocument.update({
        where: { id },
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.brandDocument.delete({
        where: { id },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const brandDocumentService = new BrandDocumentService();
