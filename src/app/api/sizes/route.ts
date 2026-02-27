import { revalidatePath } from "next/cache";

import { paginationSchema, parseSearchParams } from "@/lib/api/query-schemas";
import {
  cachedPaginatedResponse,
  createdDataResponse,
  handleError,
} from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { createSizeSchema } from "@/lib/validations/size";
import { sizeService } from "@/services/size.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, paginationSchema);

    const result = await sizeService.findAll({
      page: query.page,
      limit: query.limit,
    });

    return cachedPaginatedResponse(result, 300, 120);
  } catch (error) {
    return handleError(error, "Fetch sizes");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createSizeSchema.parse(json);
    const size = await sizeService.create(body);
    revalidatePath("/api/sizes");
    return createdDataResponse(size);
  } catch (error) {
    return handleError(error, "Create size");
  }
}
