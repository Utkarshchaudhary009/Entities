import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError } from "@/lib/api/response";
import { cached } from "@/lib/cache-headers";
import prisma from "@/lib/prisma";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);

    const product = await prisma.product.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        thumbnailUrl: true,
        defaultColor: true,
        defaultSize: true,
        category: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            size: true,
            color: true,
            stock: true,
            images: true,
          },
        },
      },
    });

    if (!product) {
      return cached.dynamic({ error: "Product not found" }, 404);
    }

    const lightweight = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      thumbnailUrl: product.thumbnailUrl,
      defaultColor: product.defaultColor,
      defaultSize: product.defaultSize,
      category: product.category,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        previewImage: variant.images[0] ?? null,
      })),
    };

    return cached.dynamic(lightweight);
  } catch (error) {
    return handleError(error, "Fetch shop product details");
  }
}

