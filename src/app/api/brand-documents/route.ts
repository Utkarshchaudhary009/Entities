import {
  brandDocumentQuerySchema,
  parseSearchParams,
} from "@/lib/api/query-schemas";
import {
  cachedSuccessResponse,
  createdDataResponse,
  handleError,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createBrandDocumentSchema } from "@/lib/validations/brand-document";
import { brandDocumentService } from "@/services/brand-document.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, brandDocumentQuerySchema);

    const result = await brandDocumentService.findAll({
      page: query.page,
      limit: query.limit,
      brandId: query.brandId,
      type: query.type,
    });

    return cachedSuccessResponse(result, 300, 120);
  } catch (error) {
    return handleError(error, "Fetch brand documents");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createBrandDocumentSchema.parse(json);
    const document = await brandDocumentService.create(body);
    return createdDataResponse(document);
  } catch (error) {
    return handleError(error, "Create brand document");
  }
}
