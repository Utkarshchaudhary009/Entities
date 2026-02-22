import { NextResponse } from "next/server";
import { productService } from "@/services/product.service";
import { createProductSchema } from "@/lib/validations/product";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const categoryId = searchParams.get("categoryId") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || undefined;

  try {
    const result = await productService.findAll({
        page,
        limit,
        categoryId,
        search,
        sort,
    });

    return NextResponse.json(result, {
        headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30"
        }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createProductSchema.parse(json);
    const product = await productService.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
