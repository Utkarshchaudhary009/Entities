import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError } from "@/lib/api/response";
import { cached } from "@/lib/cache-headers";
import prisma from "@/lib/prisma";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const color = searchParams.get("color")?.trim();

    if (!color) {
      return cached.dynamic({ error: "color query param is required" }, 400);
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: id,
        isActive: true,
        color,
      },
      select: {
        images: true,
      },
      orderBy: {
        size: "asc",
      },
    });

    const dedupedImages = Array.from(
      new Set(
        variants
          .flatMap((variant) => variant.images)
          .filter((image) => !!image),
      ),
    );

    return cached.dynamic(dedupedImages);
  } catch (error) {
    return handleError(error, "Fetch shop variant media");
  }
}
