import {
  parseSearchParams,
  socialLinkQuerySchema,
} from "@/lib/api/query-schemas";
import { createdDataResponse, handleError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { cached } from "@/lib/cache-headers";
import { createSocialLinkSchema } from "@/lib/validations/social-link";
import { socialLinkService } from "@/services/social-link.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, socialLinkQuerySchema);

    const result = await socialLinkService.findAll({
      page: query.page,
      limit: query.limit,
      brandId: query.brandId,
      founderId: query.founderId,
      platform: query.platform,
    });

    return cached.static(result);
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
    return createdDataResponse(socialLink);
  } catch (error) {
    return handleError(error, "Create social link");
  }
}
