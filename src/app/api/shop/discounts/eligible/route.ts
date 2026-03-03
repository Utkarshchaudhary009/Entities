import { z } from "zod";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { discountService } from "@/services/discount.service";

const eligibleSchema = z.object({
  subtotal: z.coerce.number().int().min(0),
});

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const { subtotal } = eligibleSchema.parse({
      subtotal: searchParams.get("subtotal") ?? "0",
    });

    const discounts = await discountService.findEligible(subtotal);
    return successDataResponse(discounts);
  } catch (error) {
    return handleError(error, "Fetch eligible discounts");
  }
}
