import { categoryService } from "@/services/category.service";
import { updateCategorySchema } from "@/lib/validations/category";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse, notFound } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const category = await categoryService.findById(id);
    if (!category) return notFound("Category not found");
    return successResponse(category);
  } catch (error) {
    return handleError(error, "Fetch category");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateCategorySchema.parse(json);
    const category = await categoryService.update(id, body);
    return successResponse(category);
  } catch (error) {
    return handleError(error, "Update category");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await categoryService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete category");
  }
}
