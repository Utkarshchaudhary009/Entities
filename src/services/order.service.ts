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
  async findAll(params: OrderFindAllParams) {
    try {
      const { page = 1, limit = 20, status, clerkId } = params;
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
      handlePrismaError(error);
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
      handlePrismaError(error);
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
      handlePrismaError(error);
    }
  }

  async create(data: CreateOrderInput) {
    try {
      if (data.items.length === 0) {
        throw new ValidationError("Order must have at least one item");
      }

      const order = await prisma.$transaction(async (tx) => {
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

        for (const item of data.items) {
          if (item.productVariantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.productVariantId },
              select: { stock: true },
            });

            if (variant && variant.stock < item.quantity) {
              throw new ValidationError(
                `Insufficient stock for ${item.productName}. Available: ${variant.stock}, Requested: ${item.quantity}`,
              );
            }

            if (variant) {
              await tx.productVariant.update({
                where: { id: item.productVariantId! },
                data: {
                  stock: { decrement: item.quantity },
                },
              });
            }
          }
        }

        return newOrder;
      });

      return order;
    } catch (error) {
      handlePrismaError(error);
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
      handlePrismaError(error);
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
      handlePrismaError(error);
    }
  }
}

export const orderService = new OrderService();
