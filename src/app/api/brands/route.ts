import { safeInngestSend } from "@/inngest/safe-send";
import { brandQuerySchema, parseSearchParams } from "@/lib/api/query-schemas";
import {
  cachedPaginatedResponse,
  createdDataResponse,
  handleError,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createBrandSchema } from "@/lib/validations/brand";
import { brandService } from "@/services/brand.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, brandQuerySchema);

    const result = await brandService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return cachedPaginatedResponse(result, 120, 60);
  } catch (error) {
    return handleError(error, "Fetch brands");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createBrandSchema.parse(json);
    const brand = await brandService.create(body);

    await safeInngestSend({
      name: "entity/brand.created.v1",
      data: {
        id: brand.id,
        name: brand.name,
        tagline: brand.tagline ?? undefined,
        logoUrl: brand.logoUrl ?? undefined,
        isActive: brand.isActive,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/brand.created.v1:${brand.id}:${Date.now()}`,
      },
    });

    return createdDataResponse(brand);
  } catch (error) {
    return handleError(error, "Create brand");
  }
}
