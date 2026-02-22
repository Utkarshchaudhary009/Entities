import { orderService } from "@/services/order.service";
import { requireAdmin, requireAuth } from "@/lib/auth/guards";
import { Role } from "@/lib/auth/roles";
import { handleError, successResponse } from "@/lib/api/response";
import { updateOrderStatusSchema } from "@/lib/validations/order";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const isAdmin = guard.auth.role === Role.ADMIN;

    const order = isAdmin
      ? await orderService.findById(id)
      : await orderService.findByIdWithOwnership(id, guard.auth.userId);

    return successResponse(order);
  } catch (error) {
    return handleError(error, "Fetch order");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateOrderStatusSchema.parse(json);

    const order = await orderService.updateStatus(id, body.status);
    return successResponse(order);
  } catch (error) {
    return handleError(error, "Update order status");
  }
}

