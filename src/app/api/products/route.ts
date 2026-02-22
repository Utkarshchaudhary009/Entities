import { NextResponse } from "next/server";
import { productService } from "@/services/product.service";
import { createProductSchema } from "@/lib/validations/product";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, createdResponse } from "@/lib/api/response";
import { productQuerySchema, parseSearchParams } from "@/lib/api/query-schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, productQuerySchema);

    const result = await productService.findAll({
      page: query.page,
      limit: query.limit,
      categoryId: query.categoryId,
      search: query.search,
      sort: query.sort,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
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
    return createdResponse(product);
  } catch (error) {
    return handleError(error, "Create product");
  }
}
