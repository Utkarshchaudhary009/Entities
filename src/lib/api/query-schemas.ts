import { z } from "zod";
import { DocumentType } from "@/generated/prisma/enums";
import { ORDER_STATUSES } from "@/types/domain";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchPaginationSchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
});

export const productQuerySchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "oldest"]).optional(),
});

export const brandQuerySchema = searchPaginationSchema;
export const categoryQuerySchema = searchPaginationSchema;
export const founderQuerySchema = searchPaginationSchema;

export const brandDocumentQuerySchema = paginationSchema.extend({
  brandId: z.string().uuid().optional(),
  type: z
    .preprocess(
      (value: unknown) =>
        typeof value === "string" ? value.toUpperCase() : value,
      z.enum(Object.values(DocumentType) as [string, ...string[]]),
    )
    .optional(),
});

export const socialLinkQuerySchema = paginationSchema.extend({
  brandId: z.string().uuid().optional(),
  founderId: z.string().uuid().optional(),
  platform: z.string().max(100).optional(),
});

export const orderQuerySchema = searchPaginationSchema.extend({
  status: z
    .preprocess(
      (value: unknown) =>
        typeof value === "string" ? value.toUpperCase() : value,
      z.enum(ORDER_STATUSES as [string, ...string[]]),
    )
    .optional(),
});

export const variantQuerySchema = z.object({
  productId: z.string().uuid(),
});

export const sessionIdSchema = z.object({
  sessionId: z.string().min(1).max(128),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export function parseSearchParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T,
): z.infer<T> {
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (value) {
      params[key] = value;
    }
  }
  return schema.parse(params);
}
