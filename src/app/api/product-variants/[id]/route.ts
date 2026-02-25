import { safeInngestSend } from "@/inngest/safe-send";
import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { productVariantService } from "@/services/product-variant.service";
import type { RouteParamsAsync } from "@/types/api";

// ... (GET and PUT handlers unchanged)

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);

    // Fetch variant to get images for storage cleanup
    const variant = await productVariantService.findById(id);
    const imageUrls = variant.images || [];

    await productVariantService.delete(id);

    // Emit storage deletion event if there are images
    if (imageUrls.length > 0) {
      await safeInngestSend({
        name: "storage/file.delete.v1",
        data: {
          bucket: "variants",
          urls: imageUrls,
          actorId: guard.auth.userId,
          idempotencyKey: `storage/delete-variant:${id}:${Date.now()}`,
        },
      });
    }

    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete variant");
  }
}
