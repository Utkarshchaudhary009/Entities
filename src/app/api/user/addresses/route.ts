import { safeInngestSend } from "@/inngest/safe-send";
import {
  createdDataResponse,
  handleError,
  successDataResponse,
} from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { addressSchema } from "@/lib/validations/user-profile";
import { userAddressService } from "@/services/user-address.service";

export async function GET(_request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const addresses = await userAddressService.getAddresses(guard.auth.userId);
    return successDataResponse(addresses);
  } catch (error) {
    return handleError(error, "Fetch user addresses");
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const data = addressSchema.parse(json);

    const address = await userAddressService.createAddress(
      guard.auth.userId,
      data,
    );

    safeInngestSend({
      name: "user/address.created.v1",
      data: {
        id: address.id,
        clerkId: address.clerkId,
        label: address.label,
        name: address.name,
        city: address.city,
        isDefault: address.isDefault,
        idempotencyKey: crypto.randomUUID(),
      },
    });

    return createdDataResponse(address);
  } catch (error) {
    return handleError(error, "Create user address");
  }
}
