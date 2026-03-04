import { revalidatePath } from "next/cache";
import { safeInngestSend } from "@/inngest/safe-send";
import { brandQuerySchema, parseSearchParams } from "@/lib/api/query-schemas";
import { createdDataResponse, handleError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { cached } from "@/lib/cache-headers";
import prisma from "@/lib/prisma";
import { createBrandSchema } from "@/lib/validations/brand";
import { brandService } from "@/services/brand.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseSearchParams(searchParams, brandQuerySchema);

    // Get all active brands (we should only ever have one, but just in case)
    const result = await brandService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    // If no brand exists, auto-create a default one to prevent 500 errors in the UI
    if (result.data.length === 0) {
      console.log("No brands found. Auto-creating a default generic brand.");
      const defaultFounder = await prisma.founder.create({
        data: { name: "Default Founder" },
      });
      const newBrand = await brandService.create({
        name: "My Store",
        founderId: defaultFounder.id,
        isActive: true,
      });
      // Fetch the full brand with relations
      const fullBrand = await brandService.findById(newBrand.id);
      return cached.aggressive({
        data: [fullBrand],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    }

    return cached.aggressive(result);
  } catch (error) {
    return handleError(error, "Fetch brands");
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const body = createBrandSchema.parse(json);

    // Enforce Single-Brand Architecture
    const existingBrands = await prisma.brand.count();
    if (existingBrands > 0) {
      throw new Error(
        "A brand already exists. This store only supports a single active brand. Please update the existing brand instead.",
      );
    }

    let founderId = body.founderId;
    if (!founderId) {
      const defaultFounder = await prisma.founder.create({
        data: {
          name: "Brand Founder",
        },
      });
      founderId = defaultFounder.id;
    }

    const { founderId: _, ...restBody } = body;

    const brand = await brandService.create({
      ...restBody,
      founderId,
      logoUrl: restBody.logoUrl || null,
      heroImageUrl: restBody.heroImageUrl || null,
      supportEmail: restBody.supportEmail || null,
    });

    await safeInngestSend({
      name: "entity/brand.created.v1",
      data: {
        id: brand.id,
        name: brand.name,
        tagline: brand.tagline ?? undefined,
        logoUrl: brand.logoUrl ?? undefined,
        heroImageUrl: brand.heroImageUrl ?? undefined,
        isActive: brand.isActive,
        actorId: guard.auth.userId,
        idempotencyKey: `entity/brand.created.v1:${brand.id}:${brand.createdAt.getTime()}`,
      },
    });

    revalidatePath("/api/brands");
    return createdDataResponse(brand);
  } catch (error) {
    return handleError(error, "Create brand");
  }
}
