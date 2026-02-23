import { safeInngestSend } from "@/inngest/safe-send";
import {
  categoryQuerySchema,
  parseSearchParams,
} from "@/lib/api/query-schemas";
import {
  cachedPaginatedResponse,
  createdDataResponse,
  handleError,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createCategorySchema } from "@/lib/validations/category";
import { categoryService } from "@/services/category.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, categoryQuerySchema);

    const result = await categoryService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return cachedPaginatedResponse(result, 120, 60);
  } catch (error) {
    return handleError(error, "Fetch categories");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createCategorySchema.parse(json);
    const category = await categoryService.create(body);

    await safeInngestSend({
      name: "entity/category.created.v1",
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        about: category.about ?? undefined,
        isActive: category.isActive,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/category.created.v1:${category.id}:${Date.now()}`,
      },
    });

    return createdDataResponse(category);
  } catch (error) {
    return handleError(error, "Create category");
  }
}
