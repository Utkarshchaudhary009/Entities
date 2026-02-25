import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
  about: z.string().optional(),
  discountPercent: z.number().int().min(0).max(100).default(0),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
