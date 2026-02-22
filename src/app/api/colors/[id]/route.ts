import { colorService } from "@/services/color.service";
import { updateColorSchema } from "@/lib/validations/color";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const color = await colorService.findById(id);
    return successResponse(color);
  } catch (error) {
    return handleError(error, "Fetch color");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateColorSchema.parse(json);
    const color = await colorService.update(id, body);
    return successResponse(color);
  } catch (error) {
    return handleError(error, "Update color");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await colorService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete color");
  }
}

