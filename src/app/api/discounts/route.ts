import type { DiscountType } from "@/generated/prisma/client";
import { paginationSchema, parseSearchParams } from "@/lib/api/query-schemas";
import {
  cachedPaginatedResponse,
  createdDataResponse,
  handleError,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createDiscountSchema } from "@/lib/validations/discount";
import { discountService } from "@/services/discount.service";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, paginationSchema);

    const result = await discountService.findAll({
      page: query.page,
      limit: query.limit,
    });

    return cachedPaginatedResponse(result, 120, 60);
  } catch (error) {
    return handleError(error, "Fetch discounts");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createDiscountSchema.parse(json);
    const discount = await discountService.create({
      ...body,
      discountType: body.discountType as DiscountType,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    return createdDataResponse(discount);
  } catch (error) {
    return handleError(error, "Create discount");
  }
}
