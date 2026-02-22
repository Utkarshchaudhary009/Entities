import { productService } from "@/services/product.service";
import { updateProductSchema } from "@/lib/validations/product";
import { requireAdmin } from "@/lib/auth/guards";
import { handleError, successResponse, notFound } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await productService.findById(id);
    if (!product) return notFound("Product not found");
    return successResponse(product);
  } catch (error) {
    return handleError(error, "Fetch product");
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateProductSchema.parse(json);
    const product = await productService.update(id, body);
    return successResponse(product);
  } catch (error) {
    return handleError(error, "Update product");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const { id } = await params;
    await productService.delete(id);
    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Delete product");
  }
}
