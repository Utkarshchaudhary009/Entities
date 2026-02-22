import { NextResponse } from "next/server";
import { founderService } from "@/services/founder.service";
import { updateFounderSchema } from "@/lib/validations/founder";
import { z } from "zod";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const founder = await founderService.findById(id);
    if (!founder) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }
    return NextResponse.json(founder);
  } catch (error) {
    console.error("Error fetching founder:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const json = await request.json();
    const body = updateFounderSchema.parse(json);
    const founder = await founderService.update(id, body);
    return NextResponse.json(founder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating founder:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await founderService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting founder:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
