import { revalidatePath } from "next/cache";

import { safeInngestSend } from "@/inngest/safe-send";
import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateCategorySchema } from "@/lib/validations/category";
import { categoryService } from "@/services/category.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const category = await categoryService.findById(id);
    return successDataResponse(category);
  } catch (error) {
    return handleError(error, "Fetch category");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateCategorySchema.parse(json);
    const category = await categoryService.update(id, body);

    await safeInngestSend({
      name: "entity/category.updated.v1",
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        about: category.about ?? undefined,
        isActive: category.isActive,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/category.updated.v1:${category.id}:${category.updatedAt.getTime()}`,
      },
    });

    revalidatePath("/api/categories");
    revalidatePath(`/api/categories/${id}`);
    return successDataResponse(category);
  } catch (error) {
    return handleError(error, "Update category");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await categoryService.delete(id);

    await safeInngestSend({
      name: "entity/category.deleted.v1",
      data: {
        id,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/category.deleted.v1:${id}`,
      },
    });

    revalidatePath("/api/categories");
    revalidatePath(`/api/categories/${id}`);
    revalidatePath("/api/categories");
    revalidatePath(`/api/categories/${id}`);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete category");
  }
}
