import { handleError } from "@/lib/api/response";
import { cached } from "@/lib/cache-headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        thumbnailUrl: true,
        category: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    });

    const catalog = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      thumbnailUrl: p.thumbnailUrl,
      categorySlug: p.category?.slug || null,
      categoryName: p.category?.name || null,
    }));

    return cached.static(catalog);
  } catch (error) {
    return handleError(error, "Fetch catalog");
  }
}
