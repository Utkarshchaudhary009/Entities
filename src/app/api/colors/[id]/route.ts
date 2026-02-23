import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateColorSchema } from "@/lib/validations/color";
import { colorService } from "@/services/color.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const color = await colorService.findById(id);
    return successDataResponse(color);
  } catch (error) {
    return handleError(error, "Fetch color");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateColorSchema.parse(json);
    const color = await colorService.update(id, body);
    return successDataResponse(color);
  } catch (error) {
    return handleError(error, "Update color");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await colorService.delete(id);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete color");
  }
}
