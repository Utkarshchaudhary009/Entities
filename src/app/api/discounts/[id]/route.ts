import { discountService } from "@/services/discount.service";
import { updateDiscountSchema } from "@/lib/validations/discount";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const discount = await discountService.findById(id);
    return successResponse(discount);
  } catch (error) {
    return handleError(error, "Fetch discount");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateDiscountSchema.parse(json);
    const discount = await discountService.update(id, {
      ...body,
      ...(body.startsAt !== undefined && {
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
      }),
      ...(body.expiresAt !== undefined && {
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      }),
    });
    return successResponse(discount);
  } catch (error) {
    return handleError(error, "Update discount");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await discountService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete discount");
  }
}

