import { brandDocumentService } from "@/services/brand-document.service";
import { updateBrandDocumentSchema } from "@/lib/validations/brand-document";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse, notFound } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const document = await brandDocumentService.findById(id);
    if (!document) return notFound("Brand document not found");
    return successResponse(document);
  } catch (error) {
    return handleError(error, "Fetch brand document");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateBrandDocumentSchema.parse(json);
    const document = await brandDocumentService.update(id, body);
    return successResponse(document);
  } catch (error) {
    return handleError(error, "Update brand document");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await brandDocumentService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete brand document");
  }
}
