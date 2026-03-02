import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, notFound, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/prisma";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      select: {
        id: true,
        size: true,
        color: true,
        stock: true,
        sku: true,
        isActive: true,
        images: true,
      },
    });

    if (!variant) {
      return notFound("Variant not found");
    }

    return successDataResponse(variant);
  } catch (error) {
    return handleError(error, "Fetch admin variant details");
  }
}
