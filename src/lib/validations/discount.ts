import { z } from "zod";
import { DISCOUNT_TYPES } from "@/types/domain";

export const createDiscountSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(DISCOUNT_TYPES as [string, ...string[]]).default("PERCENTAGE"),
  value: z.coerce.number().min(0, "Value must be positive"),
  minOrderValue: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const updateDiscountSchema = createDiscountSchema.partial();
