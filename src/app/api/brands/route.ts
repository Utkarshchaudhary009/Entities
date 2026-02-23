import { NextResponse } from "next/server";
import { z } from "zod";
import { createBrandSchema } from "@/lib/validations/brand";
import { brandService } from "@/services/brand.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || undefined;

  try {
    const result = await brandService.findAll({ page, limit, search });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createBrandSchema.parse(json);
    const { founderId, ...rest } = body;
    const brand = await brandService.create({
      ...rest,
      founder: { connect: { id: founderId } },
    });
    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
