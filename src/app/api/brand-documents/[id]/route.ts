import { NextResponse } from "next/server";
import { z } from "zod";
import { updateBrandDocumentSchema } from "@/lib/validations/brand-document";
import { brandDocumentService } from "@/services/brand-document.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const brandDocument = await brandDocumentService.findById(id);
    if (!brandDocument) {
      return NextResponse.json(
        { error: "Brand document not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(brandDocument);
  } catch (error) {
    console.error("Error fetching brand document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const json = await request.json();
    const body = updateBrandDocumentSchema.parse(json);
    const brandDocument = await brandDocumentService.update(id, body);
    return NextResponse.json(brandDocument);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating brand document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await brandDocumentService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
