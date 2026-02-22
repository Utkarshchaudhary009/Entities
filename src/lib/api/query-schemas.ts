import { z } from "zod";
import { ORDER_STATUSES } from "@/types/domain";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productQuerySchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "oldest"]).optional(),
});

export const orderQuerySchema = paginationSchema.extend({
  status: z
    .preprocess(
      (value) => (typeof value === "string" ? value.toUpperCase() : value),
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
  schema: T
): z.infer<T> {
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (value) {
      params[key] = value;
    }
  }
  return schema.parse(params);
}
