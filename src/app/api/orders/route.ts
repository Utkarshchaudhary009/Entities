import { safeInngestSend } from "@/inngest/safe-send";
import { orderQuerySchema, parseSearchParams } from "@/lib/api/query-schemas";
import {
  badRequest,
  createdDataResponse,
  handleError,
  successDataResponse,
} from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { generateOrderNumber } from "@/lib/crypto";
import { createOrderSchema } from "@/lib/validations/order";
import { cartService } from "@/services/cart.service";
import { orderService } from "@/services/order.service";

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, orderQuerySchema);

    const isAdmin = guard.auth.role === "admin";

    const result = await orderService.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
      clerkId: isAdmin ? undefined : guard.auth.userId,
    });

    return successDataResponse(result);
  } catch (error) {
    return handleError(error, "Fetch orders");
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createOrderSchema.parse(json);

    const cart = await cartService.getCartWithDetails(
      body.sessionId,
      guard.auth.userId,
    );
    if (!cart || cart.items.length === 0) {
      return badRequest("Cart is empty");
    }

    const orderNumber = generateOrderNumber();

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.productVariant.product.price * item.quantity,
      0,
    );
    const total = subtotal;

    const orderData = {
      orderNumber,
      clerkId: guard.auth.userId,
      customerName: body.customerName,
      whatsappNumber: body.whatsappNumber,
      email: body.email,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      subtotal,
      total,
      items: cart.items.map((item) => ({
        productVariantId: item.productVariantId,
        productName: item.productVariant.product.name,
        productImage: item.productVariant.product.thumbnailUrl ?? undefined,
        size: item.productVariant.size,
        color: item.productVariant.color,
        quantity: item.quantity,
        unitPrice: item.productVariant.product.price,
        totalPrice: item.productVariant.product.price * item.quantity,
      })),
    };

    const order = await orderService.create(orderData);

    await safeInngestSend({
      name: "entity/order.created.v1",
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        whatsappNumber: order.whatsappNumber,
        email: order.email ?? undefined,
        total: order.total,
        status: order.status,
        clerkId: order.clerkId ?? undefined,
        idempotencyKey: `entity/order.created.v1:${order.id}:${order.createdAt.getTime()}`,
      },
    });

    try {
      await cartService.clearCart(body.sessionId, guard.auth.userId);
    } catch (cartError) {
      // Compensation pattern: if cart clear fails, rollback the order
      await orderService.softDelete(order.id);
      throw cartError;
    }

    return createdDataResponse(order);
  } catch (error) {
    return handleError(error, "Create order");
  }
}
