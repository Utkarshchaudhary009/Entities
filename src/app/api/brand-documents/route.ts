import { NextResponse } from "next/server";
import { brandDocumentService } from "@/services/brand-document.service";
import { createBrandDocumentSchema } from "@/lib/validations/brand-document";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, createdResponse } from "@/lib/api/response";
import { paginationSchema, parseSearchParams } from "@/lib/api/query-schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, paginationSchema);

    const result = await brandDocumentService.findAll({ page: query.page, limit: query.limit });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return handleError(error, "Fetch brand documents");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createBrandDocumentSchema.parse(json);
    const document = await brandDocumentService.create(body);
    return createdResponse(document);
  } catch (error) {
    return handleError(error, "Create brand document");
  }
}
