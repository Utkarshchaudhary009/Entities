import { NextResponse } from "next/server";
import { founderService } from "@/services/founder.service";
import { createFounderSchema } from "@/lib/validations/founder";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, createdResponse } from "@/lib/api/response";
import { paginationSchema, parseSearchParams } from "@/lib/api/query-schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, paginationSchema);

    const result = await founderService.findAll({ page: query.page, limit: query.limit });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return handleError(error, "Fetch founders");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createFounderSchema.parse(json);
    const founder = await founderService.create(body);
    return createdResponse(founder);
  } catch (error) {
    return handleError(error, "Create founder");
  }
}
