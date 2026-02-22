import { NextResponse } from "next/server";
import { categoryService } from "@/services/category.service";
import { createCategorySchema } from "@/lib/validations/category";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, createdResponse } from "@/lib/api/response";
import { paginationSchema, parseSearchParams } from "@/lib/api/query-schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, paginationSchema);

    const result = await categoryService.findAll({ page: query.page, limit: query.limit });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return handleError(error, "Fetch categories");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createCategorySchema.parse(json);
    const category = await categoryService.create(body);
    return createdResponse(category);
  } catch (error) {
    return handleError(error, "Create category");
  }
}
