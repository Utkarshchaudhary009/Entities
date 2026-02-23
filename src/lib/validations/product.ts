import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.number().int().min(0, "Price must be a positive integer"),
  compareAtPrice: z.number().int().optional(),
  categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
  material: z.string().optional(),
  fabric: z.string().optional(),
  fit: z.string().optional(),
  careInstruction: z.string().optional(),
  defaultColor: z.string().optional(),
  defaultSize: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  productId: z.string().uuid("Product ID must be a valid UUID"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  colorHex: z.string().optional(),
  images: z.array(z.string().url("Invalid image URL")).default([]),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateVariantSchema = createVariantSchema.partial();

export const createProductVariantSchema = createVariantSchema;
export const updateProductVariantSchema = updateVariantSchema;
