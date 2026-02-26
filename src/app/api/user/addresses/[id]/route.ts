import { safeInngestSend } from "@/inngest/safe-send";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { updateAddressSchema } from "@/lib/validations/user-profile";
import { userAddressService } from "@/services/user-address.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const address = await userAddressService.getAddress(id, guard.auth.userId);
    return successDataResponse(address);
  } catch (error) {
    return handleError(error, "Fetch user address");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const data = updateAddressSchema.parse(json);

    const address = await userAddressService.updateAddress(
      id,
      guard.auth.userId,
      data,
    );

    safeInngestSend({
      name: "user/address.updated.v1",
      data: {
        id: address.id,
        clerkId: address.clerkId,
        changes: data,
        idempotencyKey: crypto.randomUUID(),
      },
    });

    return successDataResponse(address);
  } catch (error) {
    return handleError(error, "Update user address");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await userAddressService.deleteAddress(id, guard.auth.userId);

    safeInngestSend({
      name: "user/address.deleted.v1",
      data: {
        id,
        clerkId: guard.auth.userId,
        idempotencyKey: crypto.randomUUID(),
      },
    });

    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete user address");
  }
}
