import { NextResponse } from "next/server";
import { brandService } from "@/services/brand.service";
import { createBrandSchema } from "@/lib/validations/brand";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, createdResponse } from "@/lib/api/response";
import { paginationSchema, parseSearchParams } from "@/lib/api/query-schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, paginationSchema);

    const result = await brandService.findAll({ page: query.page, limit: query.limit });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return handleError(error, "Fetch brands");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createBrandSchema.parse(json);
    const brand = await brandService.create(body);
    return createdResponse(brand);
  } catch (error) {
    return handleError(error, "Create brand");
  }
}
