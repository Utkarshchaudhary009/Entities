import { NextResponse } from "next/server";
import { socialLinkService } from "@/services/social-link.service";
import { updateSocialLinkSchema } from "@/lib/validations/social-link";
import { z } from "zod";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const socialLink = await socialLinkService.findById(id);
    if (!socialLink) {
      return NextResponse.json({ error: "Social link not found" }, { status: 404 });
    }
    return NextResponse.json(socialLink);
  } catch (error) {
    console.error("Error fetching social link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const json = await request.json();
    const body = updateSocialLinkSchema.parse(json);
    const socialLink = await socialLinkService.update(id, body);
    return NextResponse.json(socialLink);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating social link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await socialLinkService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting social link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
