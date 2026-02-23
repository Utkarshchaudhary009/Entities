import { parseSearchParams, variantQuerySchema } from "@/lib/api/query-schemas";
import {
  createdDataResponse,
  handleError,
  successDataResponse,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createVariantSchema } from "@/lib/validations/product";
import { productVariantService } from "@/services/product-variant.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, variantQuerySchema);

    const result = await productVariantService.findByProductId(query.productId);
    return successDataResponse(result);
  } catch (error) {
    return handleError(error, "Fetch variants");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createVariantSchema.parse(json);
    const variant = await productVariantService.create(body);
    return createdDataResponse(variant);
  } catch (error) {
    return handleError(error, "Create variant");
  }
}
