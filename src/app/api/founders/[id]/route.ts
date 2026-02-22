import { founderService } from "@/services/founder.service";
import { updateFounderSchema } from "@/lib/validations/founder";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse, notFound } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const founder = await founderService.findById(id);
    if (!founder) return notFound("Founder not found");
    return successResponse(founder);
  } catch (error) {
    return handleError(error, "Fetch founder");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateFounderSchema.parse(json);
    const founder = await founderService.update(id, body);
    return successResponse(founder);
  } catch (error) {
    return handleError(error, "Update founder");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await founderService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete founder");
  }
}
