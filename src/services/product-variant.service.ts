import type { Prisma } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class ProductVariantService {
  async findByProductId(productId: string) {
    try {
      return await prisma.productVariant.findMany({
        where: { productId, isActive: true },
        orderBy: { size: "asc" },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async findById(id: string) {
    try {
      const variant = await prisma.productVariant.findUnique({
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
      if (!variant) {
        throw new NotFoundError("ProductVariant", id);
      }
      return variant;
    } catch (error) {
      return handlePrismaError(error);
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
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.ProductVariantUpdateInput) {
    try {
      return await prisma.productVariant.update({
        where: { id },
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.productVariant.delete({
        where: { id },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const productVariantService = new ProductVariantService();
