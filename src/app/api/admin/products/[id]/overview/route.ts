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

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        categoryId: true,
        thumbnailUrl: true,
        material: true,
        fabric: true,
        fit: true,
        careInstruction: true,
        defaultColor: true,
        defaultSize: true,
        isFeatured: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!product) {
      return notFound("Product not found");
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      select: {
        id: true,
        size: true,
        color: true,
        stock: true,
        sku: true,
        isActive: true,
        images: true,
      },
      orderBy: [{ isActive: "desc" }, { size: "asc" }],
    });

    return successDataResponse({
      product: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      variants: variants.map((variant) => ({
        id: variant.id,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        sku: variant.sku,
        isActive: variant.isActive,
        previewImage: variant.images[0] ?? null,
      })),
    });
  } catch (error) {
    return handleError(error, "Fetch admin product overview");
  }
}
