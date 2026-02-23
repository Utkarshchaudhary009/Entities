import { headers } from "next/headers";
import { sessionIdSchema } from "@/lib/api/query-schemas";
import {
  badRequest,
  createdDataResponse,
  handleError,
  successDataResponse,
} from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { addToCartSchema } from "@/lib/validations/cart";
import { cartService } from "@/services/cart.service";

export async function GET(_request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const headerStore = await headers();
    const sessionId = headerStore.get("x-session-id");
    if (!sessionId) {
      return badRequest("Missing x-session-id header");
    }
    const query = sessionIdSchema.parse({ sessionId });

    const summary = await cartService.getCartSummary(
      query.sessionId,
      guard.auth.userId,
    );
    return successDataResponse(summary);
  } catch (error) {
    return handleError(error, "Fetch cart");
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const headerStore = await headers();
    const sessionId = headerStore.get("x-session-id");
    if (!sessionId) {
      return badRequest("Missing x-session-id header");
    }
    const query = sessionIdSchema.parse({ sessionId });

    const json = await request.json();
    const { productVariantId, quantity } = addToCartSchema.parse(json);
    const cartItem = await cartService.addItem(
      query.sessionId,
      productVariantId,
      quantity,
      guard.auth.userId,
    );
    return createdDataResponse(cartItem);
  } catch (error) {
    return handleError(error, "Add to cart");
  }
}

export async function DELETE(_request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const headerStore = await headers();
    const sessionId = headerStore.get("x-session-id");
    if (!sessionId) {
      return badRequest("Missing x-session-id header");
    }
    const query = sessionIdSchema.parse({ sessionId });

    await cartService.clearCart(query.sessionId, guard.auth.userId);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Clear cart");
  }
}
