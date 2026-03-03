import { z } from "zod";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { discountService } from "@/services/discount.service";

const validateDiscountSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  subtotal: z.number().int().min(0, "Subtotal must be non-negative"),
});

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const { code, subtotal } = validateDiscountSchema.parse(json);

    const result = await discountService.validateByCode(code, subtotal);
    return successDataResponse(result);
  } catch (error) {
    return handleError(error, "Validate discount code");
  }
}
