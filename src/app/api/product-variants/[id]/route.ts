import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateVariantSchema } from "@/lib/validations/product";
import { productVariantService } from "@/services/product-variant.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const variant = await productVariantService.findById(id);
    return successDataResponse(variant);
  } catch (error) {
    return handleError(error, "Fetch variant");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateVariantSchema.parse(json);
    const variant = await productVariantService.update(id, body);
    return successDataResponse(variant);
  } catch (error) {
    return handleError(error, "Update variant");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await productVariantService.delete(id);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete variant");
  }
}
