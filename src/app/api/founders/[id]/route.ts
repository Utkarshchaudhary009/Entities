import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateFounderSchema } from "@/lib/validations/founder";
import { founderService } from "@/services/founder.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const founder = await founderService.findById(id);
    return successDataResponse(founder);
  } catch (error) {
    return handleError(error, "Fetch founder");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateFounderSchema.parse(json);
    const founder = await founderService.update(id, body);
    return successDataResponse(founder);
  } catch (error) {
    return handleError(error, "Update founder");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await founderService.delete(id);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete founder");
  }
}
