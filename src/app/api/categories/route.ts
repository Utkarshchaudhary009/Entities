import { NextResponse } from "next/server";
import { categoryService } from "@/services/category.service";
import { createCategorySchema } from "@/lib/validations/category";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const search = searchParams.get("search") || undefined;

  try {
    const result = await categoryService.findAll({ page, limit, search });
    return NextResponse.json(result, {
        headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60"
        }
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createCategorySchema.parse(json);
    const category = await categoryService.create(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
