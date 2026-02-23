import { NextResponse } from "next/server";
import { z } from "zod";
import { createBrandDocumentSchema } from "@/lib/validations/brand-document";
import { brandDocumentService } from "@/services/brand-document.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const brandId = searchParams.get("brandId") || undefined;
  const type = searchParams.get("type") || undefined;

  try {
    const result = await brandDocumentService.findAll({
      page,
      limit,
      brandId,
      type,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching brand documents:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createBrandDocumentSchema.parse(json);
    const { brandId, ...rest } = body;
    const brandDocument = await brandDocumentService.create({
      ...rest,
      brand: { connect: { id: brandId } },
    });
    return NextResponse.json(brandDocument, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating brand document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
