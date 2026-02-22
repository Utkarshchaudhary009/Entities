import { productVariantService } from "@/services/product-variant.service";
import { updateVariantSchema } from "@/lib/validations/product";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse, notFound } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const variant = await productVariantService.findById(id);
    if (!variant) return notFound("Variant not found");
    return successResponse(variant);
  } catch (error) {
    return handleError(error, "Fetch variant");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateVariantSchema.parse(json);
    const variant = await productVariantService.update(id, body);
    return successResponse(variant);
  } catch (error) {
    return handleError(error, "Update variant");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await productVariantService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete variant");
  }
}
