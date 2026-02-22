import { brandService } from "@/services/brand.service";
import { updateBrandSchema } from "@/lib/validations/brand";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse, notFound } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const brand = await brandService.findById(id);
    if (!brand) return notFound("Brand not found");
    return successResponse(brand);
  } catch (error) {
    return handleError(error, "Fetch brand");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateBrandSchema.parse(json);
    const brand = await brandService.update(id, body);
    return successResponse(brand);
  } catch (error) {
    return handleError(error, "Update brand");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await brandService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete brand");
  }
}
