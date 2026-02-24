import type { OrderStatus } from "@/generated/prisma/client";
import { safeInngestSend } from "@/inngest/safe-send";
import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin, requireAuth } from "@/lib/auth/guards";
import { Role } from "@/lib/auth/roles";
import { updateOrderDetailsSchema } from "@/lib/validations/order";
import { orderService } from "@/services/order.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const isAdmin = guard.auth.role === Role.ADMIN;

    const order = isAdmin
      ? await orderService.findById(id)
      : await orderService.findByIdWithOwnership(id, guard.auth.userId);

    return successDataResponse(order);
  } catch (error) {
    return handleError(error, "Fetch order");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateOrderDetailsSchema.parse(json);

    const currentOrder = await orderService.findById(id);
    const order = await orderService.updateOrderDetails(id, {
      status: body.status as OrderStatus | undefined,
      adminNotes: body.adminNotes,
    });

    if (body.status && currentOrder.status !== body.status) {
      await safeInngestSend({
        name: "entity/order.status-changed.v1",
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          previousStatus: currentOrder.status,
          newStatus: order.status,
          actorId: guard.auth.userId,
          idempotencyKey: `entity/order.status-changed.v1:${order.id}:${Date.now()}`,
        },
      });
    }

    return successDataResponse(order);
  } catch (error) {
    return handleError(error, "Update order status");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await orderService.softDelete(id);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete order");
  }
}
