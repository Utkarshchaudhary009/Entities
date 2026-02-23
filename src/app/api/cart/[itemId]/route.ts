import { z } from "zod";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { updateCartItemSchema } from "@/lib/validations/cart";
import { cartService } from "@/services/cart.service";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

const itemIdParamSchema = z.object({
  itemId: z.string().uuid(),
});

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { itemId } = itemIdParamSchema.parse(await params);
    const json = await request.json();
    const { quantity } = updateCartItemSchema.parse(json);
    const cartItem = await cartService.updateItem(
      itemId,
      quantity,
      guard.auth.userId,
    );
    return successDataResponse(cartItem);
  } catch (error) {
    return handleError(error, "Update cart item");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { itemId } = itemIdParamSchema.parse(await params);
    await cartService.removeItem(itemId, guard.auth.userId);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete cart item");
  }
}
