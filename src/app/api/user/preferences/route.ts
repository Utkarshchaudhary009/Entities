import { safeInngestSend } from "@/inngest/safe-send";
import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import { preferencesSchema } from "@/lib/validations/user-profile";
import { userPreferenceService } from "@/services/user-preference.service";

export async function GET(_request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const preferences = await userPreferenceService.getPreferences(
      guard.auth.userId,
    );
    return successDataResponse(preferences);
  } catch (error) {
    return handleError(error, "Fetch user preferences");
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAuth();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const data = preferencesSchema.parse(json);

    const preferences = await userPreferenceService.updatePreferences(
      guard.auth.userId,
      data,
    );

    safeInngestSend({
      name: "user/preferences.updated.v1",
      data: {
        clerkId: guard.auth.userId,
        changes: data,
        idempotencyKey: crypto.randomUUID(),
      },
    });

    return successDataResponse(preferences);
  } catch (error) {
    return handleError(error, "Update user preferences");
  }
}
