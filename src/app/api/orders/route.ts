import { orderService } from "@/services/order.service";
import { createOrderSchema } from "@/lib/validations/order";
import { cartService } from "@/services/cart.service";
import { requireAuth, requireAdmin } from "@/lib/auth/guards";
import { handleError, createdResponse, successResponse, badRequest } from "@/lib/api/response";
import { orderQuerySchema, parseSearchParams } from "@/lib/api/query-schemas";
import { generateOrderNumber } from "@/lib/crypto";
import { Role } from "@/lib/auth/roles";

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, orderQuerySchema);

    const isAdmin = guard.auth.role === Role.ADMIN;

    const result = await orderService.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      clerkId: isAdmin ? undefined : guard.auth.userId,
    });

    return successResponse(result);
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

    const cart = await cartService.getCartWithDetails(body.sessionId, guard.auth.userId);
    if (!cart || cart.items.length === 0) {
      return badRequest("Cart is empty");
    }

    const orderNumber = generateOrderNumber();

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.productVariant.product.price * item.quantity,
      0
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

    await cartService.clearCart(body.sessionId, guard.auth.userId);

    return createdResponse(order);
  } catch (error) {
    return handleError(error, "Create order");
  }
}
