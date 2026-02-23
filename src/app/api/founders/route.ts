import { founderQuerySchema, parseSearchParams } from "@/lib/api/query-schemas";
import {
  cachedSuccessResponse,
  createdDataResponse,
  handleError,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createFounderSchema } from "@/lib/validations/founder";
import { founderService } from "@/services/founder.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, founderQuerySchema);

    const result = await founderService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return cachedSuccessResponse(result, 300, 120);
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
    return createdDataResponse(founder);
  } catch (error) {
    return handleError(error, "Create founder");
  }
}
