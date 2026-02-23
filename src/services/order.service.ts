import type { Prisma } from "@/generated/prisma/client";
import {
  handlePrismaError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import prisma from "@/lib/prisma";
import { ORDER_STATUSES, type OrderStatus } from "@/types/domain";

export interface OrderFindAllParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | string;
  clerkId?: string;
}

export interface CreateOrderInput {
  orderNumber: string;
  clerkId?: string;
  customerName: string;
  whatsappNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discountCode?: string;
  discountAmount?: number;
  shippingCost?: number;
  total: number;
  notes?: string;
  items: Array<{
    productVariantId: string | null;
    productName: string;
    productImage?: string;
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export class OrderService {
  async findAll(params: OrderFindAllParams = {}) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const { status, clerkId } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {
        deletedAt: null,
        ...(status && { status: status as OrderStatus }),
        ...(clerkId && { clerkId }),
      };

      const [data, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
          },
        }),
        prisma.order.count({ where }),
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

  async findById(id: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { id, deletedAt: null },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundError("Order", id);
      }

      return order;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async findByIdWithOwnership(id: string, clerkId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { id, clerkId, deletedAt: null },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundError("Order", id);
      }

      return order;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: CreateOrderInput) {
    try {
      if (data.items.length === 0) {
        throw new ValidationError("Order must have at least one item");
      }

      const aggregatedVariantQuantities = new Map<
        string,
        { quantity: number; productName: string }
      >();
      for (const item of data.items) {
        if (!item.productVariantId) continue;
        if (item.quantity <= 0) {
          throw new ValidationError(`Invalid quantity for ${item.productName}`);
        }
        const prev = aggregatedVariantQuantities.get(item.productVariantId);
        aggregatedVariantQuantities.set(item.productVariantId, {
          quantity: (prev?.quantity ?? 0) + item.quantity,
          productName: prev?.productName ?? item.productName,
        });
      }

      const order = await prisma.$transaction(async (tx) => {
        // Validate stock and decrement atomically BEFORE creating the order.
        for (const [
          variantId,
          entry,
        ] of aggregatedVariantQuantities.entries()) {
          const updated = await tx.$queryRaw<{ stock: number }[]>`
            UPDATE "product_variants"
            SET stock = stock - ${entry.quantity}
            WHERE id = ${variantId} AND stock >= ${entry.quantity}
            RETURNING stock
          `;

          if (updated.length === 0) {
            const existing = await tx.productVariant.findUnique({
              where: { id: variantId },
              select: { stock: true },
            });

            if (!existing) {
              throw new NotFoundError("Product variant", variantId);
            }

            throw new ValidationError(
              `Insufficient stock for ${entry.productName}. Available: ${existing.stock}, Requested: ${entry.quantity}`,
            );
          }
        }

        const newOrder = await tx.order.create({
          data: {
            orderNumber: data.orderNumber,
            clerkId: data.clerkId,
            customerName: data.customerName,
            whatsappNumber: data.whatsappNumber,
            email: data.email,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            subtotal: data.subtotal,
            discountCode: data.discountCode,
            discountAmount: data.discountAmount ?? 0,
            shippingCost: data.shippingCost ?? 0,
            total: data.total,
            notes: data.notes,
            items: {
              create: data.items.map((item) => ({
                productVariantId: item.productVariantId,
                productName: item.productName,
                productImage: item.productImage,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
          },
          include: { items: true },
        });

        return newOrder;
      });

      return order;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async updateStatus(id: string, status: OrderStatus) {
    try {
      if (!ORDER_STATUSES.includes(status)) {
        throw new ValidationError(`Invalid order status: ${status}`);
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: { items: true },
      });

      return order;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async softDelete(id: string) {
    try {
      const order = await prisma.order.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return order;
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const orderService = new OrderService();
