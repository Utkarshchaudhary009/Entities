import { revalidatePath } from "next/cache";
import { safeInngestSend } from "@/inngest/safe-send";
import { parseSearchParams, productQuerySchema } from "@/lib/api/query-schemas";
import { createdDataResponse, handleError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { cached } from "@/lib/cache-headers";
import { createProductSchema } from "@/lib/validations/product";
import { productService } from "@/services/product.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, productQuerySchema);

    // If the requester is an admin, include inactive products in the results
    const adminGuard = await requireAdmin();
    const isAdmin = adminGuard.success;

    const result = await productService.findAll({
      page: query.page,
      limit: query.limit,
      categoryId: query.categoryId,
      search: query.search,
      sort: query.sort,
      includeInactive: isAdmin,
    });

    return cached.static(result);
  } catch (error) {
    return handleError(error, "Fetch products");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createProductSchema.parse(json);
    const product = await productService.create(body);

    await safeInngestSend({
      name: "entity/product.created.v1",
      data: {
        id: product.id,
        name: product.name,
        description: product.description ?? undefined,
        price: product.price,
        categoryId: product.categoryId,
        isActive: product.isActive,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/product.created.v1:${product.id}:${product.createdAt.getTime()}`,
      },
    });

    revalidatePath("/api/products");
    revalidatePath("/api/shop/catalog");
    return createdDataResponse(product);
  } catch (error) {
    return handleError(error, "Create product");
  }
}
