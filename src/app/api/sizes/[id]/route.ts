import { revalidatePath } from "next/cache";

import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateSizeSchema } from "@/lib/validations/size";
import { sizeService } from "@/services/size.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const size = await sizeService.findById(id);
    return successDataResponse(size);
  } catch (error) {
    return handleError(error, "Fetch size");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateSizeSchema.parse(json);
    const size = await sizeService.update(id, body);
    revalidatePath("/api/sizes");
    revalidatePath(`/api/sizes/${id}`);
    return successDataResponse(size);
  } catch (error) {
    return handleError(error, "Update size");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await sizeService.delete(id);
    revalidatePath("/api/sizes");
    revalidatePath(`/api/sizes/${id}`);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete size");
  }
}
