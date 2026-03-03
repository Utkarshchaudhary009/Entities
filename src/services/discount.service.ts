import type { Prisma } from "@/generated/prisma/client";
import {
  handlePrismaError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import prisma from "@/lib/prisma";

export interface ValidatedDiscount {
  code: string;
  discountType: string;
  value: number;
  discountAmount: number;
  finalTotal: number;
}

export class DiscountService {
  async findAll(params: { page?: number; limit?: number } = {}) {
    try {
      const page = Math.max(1, Math.floor(params.page ?? 1));
      const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
      const skip = (page - 1) * limit;

      const where: Prisma.DiscountWhereInput = {
        isActive: true,
      };

      const [data, total] = await Promise.all([
        prisma.discount.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.discount.count({ where }),
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
      const discount = await prisma.discount.findUnique({ where: { id } });
      if (!discount) throw new NotFoundError("Discount", id);
      return discount;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async create(data: Prisma.DiscountUncheckedCreateInput) {
    try {
      return await prisma.discount.create({ data });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async update(id: string, data: Prisma.DiscountUncheckedUpdateInput) {
    try {
      return await prisma.discount.update({ where: { id }, data });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      return await prisma.discount.delete({ where: { id } });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  /**
   * Validate a coupon code against a subtotal and compute the discount amount.
   * Checks: active, within date window, minOrderValue, usageLimit.
   */
  async validateByCode(
    code: string,
    subtotal: number,
  ): Promise<ValidatedDiscount> {
    try {
      const now = new Date();
      const discount = await prisma.discount.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!discount || !discount.isActive) {
        throw new NotFoundError("Discount", code);
      }
      if (discount.startsAt && discount.startsAt > now) {
        throw new ValidationError(`Coupon "${code}" is not yet active`);
      }
      if (discount.expiresAt && discount.expiresAt < now) {
        throw new ValidationError(`Coupon "${code}" has expired`);
      }
      if (
        discount.usageLimit !== null &&
        discount.usageCount >= discount.usageLimit
      ) {
        throw new ValidationError(
          `Coupon "${code}" has reached its usage limit`,
        );
      }
      if (subtotal < discount.minOrderValue) {
        throw new ValidationError(
          `Minimum order value for this coupon is \u20b9${Math.floor(discount.minOrderValue).toLocaleString("en-IN")}`,
        );
      }

      let discountAmount = 0;
      if (discount.discountType === "PERCENTAGE") {
        discountAmount = Math.floor((subtotal * discount.value) / 100);
        if (discount.maxDiscount !== null) {
          discountAmount = Math.min(discountAmount, discount.maxDiscount);
        }
      } else if (discount.discountType === "FIXED") {
        discountAmount = Math.min(Math.floor(discount.value), subtotal);
      } else {
        // BOGO: flat 50% off
        discountAmount = Math.floor(subtotal / 2);
      }

      const finalTotal = Math.max(0, subtotal - discountAmount);

      return {
        code: discount.code,
        discountType: discount.discountType,
        value: discount.value,
        discountAmount,
        finalTotal,
      };
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  /**
   * Find all discounts eligible for a given subtotal
   * (active, within dates, minOrderValue met, usage not exhausted).
   */
  async findEligible(subtotal: number) {
    try {
      const now = new Date();
      // Fetch all candidate discounts then filter usage client-side
      // (Prisma cannot compare two columns in a where clause without raw SQL)
      const discounts = await prisma.discount.findMany({
        where: {
          isActive: true,
          minOrderValue: { lte: subtotal },
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
          ],
        },
        orderBy: { value: "desc" },
      });
      // Filter out exhausted coupons in application layer
      return discounts.filter(
        (d) => d.usageLimit === null || d.usageCount < d.usageLimit,
      );
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  /** Atomically increment usageCount for a discount by code. Non-critical — call fire-and-forget. */
  async incrementUsage(code: string) {
    try {
      await prisma.discount.update({
        where: { code: code.toUpperCase() },
        data: { usageCount: { increment: 1 } },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const discountService = new DiscountService();
