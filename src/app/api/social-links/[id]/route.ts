import { socialLinkService } from "@/services/social-link.service";
import { updateSocialLinkSchema } from "@/lib/validations/social-link";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse, notFound } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const socialLink = await socialLinkService.findById(id);
    if (!socialLink) return notFound("Social link not found");
    return successResponse(socialLink);
  } catch (error) {
    return handleError(error, "Fetch social link");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateSocialLinkSchema.parse(json);
    const socialLink = await socialLinkService.update(id, body);
    return successResponse(socialLink);
  } catch (error) {
    return handleError(error, "Update social link");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await socialLinkService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete social link");
  }
}
