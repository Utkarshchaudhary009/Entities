import { NextResponse } from "next/server";
import { socialLinkService } from "@/services/social-link.service";
import { createSocialLinkSchema } from "@/lib/validations/social-link";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const brandId = searchParams.get("brandId") || undefined;
  const founderId = searchParams.get("founderId") || undefined;
  const platform = searchParams.get("platform") || undefined;

  try {
    const result = await socialLinkService.findAll({ page, limit, brandId, founderId, platform });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching social links:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createSocialLinkSchema.parse(json);
    const socialLink = await socialLinkService.create(body);
    return NextResponse.json(socialLink, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating social link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
