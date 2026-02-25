import { z } from "zod";

export const addToCartSchema = z.object({
  productVariantId: z.string().uuid("Variant ID must be a valid UUID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be at least 0"),
});
