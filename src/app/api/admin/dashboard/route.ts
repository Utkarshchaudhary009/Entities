import { handleError, successDataResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { adminDashboardService } from "@/services/admin-dashboard.service";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const overview = await adminDashboardService.getOverview();
    return successDataResponse(overview);
  } catch (error) {
    return handleError(error, "Fetch admin dashboard overview");
  }
}
