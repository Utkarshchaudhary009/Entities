import { cartService } from "@/services/cart.service";
import { updateCartItemSchema } from "@/lib/validations/cart";
import { requireAuth } from "@/lib/auth/guards";
import { handleError, successResponse } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { itemId } = await params;
    const json = await request.json();
    const { quantity } = updateCartItemSchema.parse(json);
    const cartItem = await cartService.updateItem(itemId, quantity, guard.auth.userId);
    return successResponse(cartItem);
  } catch (error) {
    return handleError(error, "Update cart item");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { itemId } = await params;
    await cartService.removeItem(itemId, guard.auth.userId);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete cart item");
  }
}
