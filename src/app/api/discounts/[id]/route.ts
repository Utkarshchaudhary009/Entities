import type { DiscountType } from "@/generated/prisma/client";
import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateDiscountSchema } from "@/lib/validations/discount";
import { discountService } from "@/services/discount.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const discount = await discountService.findById(id);
    return successDataResponse(discount);
  } catch (error) {
    return handleError(error, "Fetch discount");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const { discountType, startsAt, expiresAt, ...rest } =
      updateDiscountSchema.parse(json);
    const discount = await discountService.update(id, {
      ...rest,
      ...(discountType && { discountType: discountType as DiscountType }),
      ...(startsAt !== undefined && {
        startsAt: startsAt ? new Date(startsAt) : null,
      }),
      ...(expiresAt !== undefined && {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }),
    });
    return successDataResponse(discount);
  } catch (error) {
    return handleError(error, "Update discount");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await discountService.delete(id);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete discount");
  }
}
