import { revalidatePath } from "next/cache";

import { safeInngestSend } from "@/inngest/safe-send";
import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateBrandSchema } from "@/lib/validations/brand";
import { brandService } from "@/services/brand.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const brand = await brandService.findById(id);
    return successDataResponse(brand);
  } catch (error) {
    return handleError(error, "Fetch brand");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateBrandSchema.parse(json);
    const brand = await brandService.update(id, body);

    await safeInngestSend({
      name: "entity/brand.updated.v1",
      data: {
        id: brand.id,
        name: brand.name,
        tagline: brand.tagline ?? undefined,
        logoUrl: brand.logoUrl ?? undefined,
        isActive: brand.isActive,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/brand.updated.v1:${brand.id}:${brand.updatedAt.getTime()}`,
      },
    });

    revalidatePath("/api/brands");
    revalidatePath(`/api/brands/${id}`);
    return successDataResponse(brand);
  } catch (error) {
    return handleError(error, "Update brand");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await brandService.delete(id);

    await safeInngestSend({
      name: "entity/brand.deleted.v1",
      data: {
        id,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/brand.deleted.v1:${id}`,
      },
    });

    revalidatePath("/api/brands");
    revalidatePath(`/api/brands/${id}`);
    revalidatePath("/api/brands");
    revalidatePath(`/api/brands/${id}`);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete brand");
  }
}
