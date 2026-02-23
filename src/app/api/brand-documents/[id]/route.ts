import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateBrandDocumentSchema } from "@/lib/validations/brand-document";
import { brandDocumentService } from "@/services/brand-document.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const document = await brandDocumentService.findById(id);
    return successDataResponse(document);
  } catch (error) {
    return handleError(error, "Fetch brand document");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateBrandDocumentSchema.parse(json);
    const document = await brandDocumentService.update(id, body);
    return successDataResponse(document);
  } catch (error) {
    return handleError(error, "Update brand document");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await brandDocumentService.delete(id);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete brand document");
  }
}
