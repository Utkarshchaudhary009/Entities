import { safeInngestSend } from "@/inngest/safe-send";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { userAddressService } from "@/services/user-address.service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const address = await userAddressService.setDefaultAddress(
      id,
      guard.auth.userId,
    );

    safeInngestSend({
      name: "user/address.default-changed.v1",
      data: {
        id,
        clerkId: guard.auth.userId,
        idempotencyKey: crypto.randomUUID(),
      },
    });

    return successDataResponse(address);
  } catch (error) {
    return handleError(error, "Set default user address");
  }
}
