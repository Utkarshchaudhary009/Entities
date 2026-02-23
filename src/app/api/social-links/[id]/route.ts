import { idParamSchema } from "@/lib/api/query-schemas";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateSocialLinkSchema } from "@/lib/validations/social-link";
import { socialLinkService } from "@/services/social-link.service";
import type { RouteParamsAsync } from "@/types/api";

export async function GET(_request: Request, { params }: RouteParamsAsync) {
  try {
    const { id } = idParamSchema.parse(await params);
    const socialLink = await socialLinkService.findById(id);
    return successDataResponse(socialLink);
  } catch (error) {
    return handleError(error, "Fetch social link");
  }
}

export async function PUT(request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const body = updateSocialLinkSchema.parse(json);
    const socialLink = await socialLinkService.update(id, body);
    return successDataResponse(socialLink);
  } catch (error) {
    return handleError(error, "Update social link");
  }
}

export async function DELETE(_request: Request, { params }: RouteParamsAsync) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = idParamSchema.parse(await params);
    await socialLinkService.delete(id);
    return successDataResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete social link");
  }
}
