import { cartService } from "@/services/cart.service";
import { addToCartSchema } from "@/lib/validations/cart";
import { requireAuth } from "@/lib/auth/guards";
import { handleError, createdResponse, successResponse, badRequest } from "@/lib/api/response";
import { sessionIdSchema, parseSearchParams } from "@/lib/api/query-schemas";

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, sessionIdSchema);

    const summary = await cartService.getCartSummary(query.sessionId, guard.auth.userId);
    return successResponse(summary);
  } catch (error) {
    return handleError(error, "Fetch cart");
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, sessionIdSchema);

    const json = await request.json();
    const { productVariantId, quantity } = addToCartSchema.parse(json);
    const cartItem = await cartService.addItem(
      query.sessionId,
      productVariantId,
      quantity,
      guard.auth.userId,
    );
    return createdResponse(cartItem);
  } catch (error) {
    return handleError(error, "Add to cart");
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, sessionIdSchema);

    await cartService.clearCart(query.sessionId, guard.auth.userId);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Clear cart");
  }
}
