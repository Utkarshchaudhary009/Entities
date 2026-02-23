import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCartItemSchema } from "@/lib/validations/cart";
import { cartService } from "@/services/cart.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  try {
    const json = await request.json();
    const { quantity } = updateCartItemSchema.parse(json);
    const cartItem = await cartService.updateItem(itemId, quantity);
    return NextResponse.json(cartItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  try {
    await cartService.removeItem(itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
