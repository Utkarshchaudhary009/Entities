import { NextResponse } from "next/server";
import { socialLinkService } from "@/services/social-link.service";
import { createSocialLinkSchema } from "@/lib/validations/social-link";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, createdResponse } from "@/lib/api/response";
import { paginationSchema, parseSearchParams } from "@/lib/api/query-schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, paginationSchema);

    const result = await socialLinkService.findAll({ page: query.page, limit: query.limit });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return handleError(error, "Fetch social links");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createSocialLinkSchema.parse(json);
    const socialLink = await socialLinkService.create(body);
    return createdResponse(socialLink);
  } catch (error) {
    return handleError(error, "Create social link");
  }
}
