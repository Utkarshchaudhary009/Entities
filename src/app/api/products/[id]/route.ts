import { safeInngestSend } from "@/inngest/safe-send";
import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateProductSchema } from "@/lib/validations/product";
import { productService } from "@/services/product.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const product = await productService.findById(id);
    return successDataResponse(product);
  } catch (error) {
    return handleError(error, "Fetch product");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateProductSchema.parse(json);
    const product = await productService.update(id, body);

    await safeInngestSend({
      name: "entity/product.updated.v1",
      data: {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: product.price,
        isActive: product.isActive,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/product.updated.v1:${product.id}:${Date.now()}`,
      },
    });

    return successDataResponse(product);
  } catch (error) {
    return handleError(error, "Update product");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await productService.delete(id);

    await safeInngestSend({
      name: "entity/product.deleted.v1",
      data: {
        id,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/product.deleted.v1:${id}:${Date.now()}`,
      },
    });

    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete product");
  }
}
