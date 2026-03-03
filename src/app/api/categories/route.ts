import { revalidatePath } from "next/cache";
import { safeInngestSend } from "@/inngest/safe-send";
import {
  categoryQuerySchema,
  parseSearchParams,
} from "@/lib/api/query-schemas";
import { createdDataResponse, handleError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { cached } from "@/lib/cache-headers";
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

    return cached.static(result);
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
        idempotencyKey: `entity/category.created.v1:${category.id}:${category.createdAt.getTime()}`,
      },
    });

    revalidatePath("/api/categories");
    revalidatePath("/api/shop/catalog");
    return createdDataResponse(category);
  } catch (error) {
    return handleError(error, "Create category");
  }
}
