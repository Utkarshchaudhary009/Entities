import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.number().int().min(0, "Price must be a positive integer"),
  compareAtPrice: z.number().int().optional(),
  categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
  images: z.array(z.string().url("Invalid image URL")).default([]),
  defaultColor: z.string().optional(),
  defaultSize: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();
