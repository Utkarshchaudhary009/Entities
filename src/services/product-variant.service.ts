import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { handlePrismaError } from "@/lib/errors";

export class ProductVariantService {
  async findByProductId(productId: string) {
    try {
      return await prisma.productVariant.findMany({
        where: { productId, isActive: true },
        orderBy: { size: "asc" },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      return await prisma.productVariant.findUnique({
        where: { id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              thumbnailUrl: true,
            },
          },
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: {
    productId: string;
    size: string;
    color: string;
    colorHex?: string;
    images?: string[];
    stock?: number;
    sku?: string;
    isActive?: boolean;
  }) {
    try {
      return await prisma.productVariant.create({
        data: {
          product: { connect: { id: data.productId } },
          size: data.size,
          color: data.color,
          colorHex: data.colorHex,
          images: data.images || [],
          stock: data.stock || 0,
          sku: data.sku,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.ProductVariantUpdateInput) {
    try {
      return await prisma.productVariant.update({
        where: { id },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.productVariant.delete({
        where: { id },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const productVariantService = new ProductVariantService();
