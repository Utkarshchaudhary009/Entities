import { sizeService } from "@/services/size.service";
import { updateSizeSchema } from "@/lib/validations/size";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const size = await sizeService.findById(id);
    return successResponse(size);
  } catch (error) {
    return handleError(error, "Fetch size");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateSizeSchema.parse(json);
    const size = await sizeService.update(id, body);
    return successResponse(size);
  } catch (error) {
    return handleError(error, "Update size");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await sizeService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete size");
  }
}

