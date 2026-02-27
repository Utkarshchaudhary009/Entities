import { revalidatePath } from "next/cache";

import { paginationSchema, parseSearchParams } from "@/lib/api/query-schemas";
import {
  cachedPaginatedResponse,
  createdDataResponse,
  handleError,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createColorSchema } from "@/lib/validations/color";
import { colorService } from "@/services/color.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, paginationSchema);

    const result = await colorService.findAll({
      page: query.page,
      limit: query.limit,
    });

    return cachedPaginatedResponse(result, 300, 120);
  } catch (error) {
    return handleError(error, "Fetch colors");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createColorSchema.parse(json);
    const color = await colorService.create(body);
    revalidatePath("/api/colors");
    revalidatePath("/api/colors");
    return createdDataResponse(color);
  } catch (error) {
    return handleError(error, "Create color");
  }
}
