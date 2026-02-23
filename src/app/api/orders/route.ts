import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrderSchema } from "@/lib/validations/order";
import { cartService } from "@/services/cart.service";
import { orderService } from "@/services/order.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const status = searchParams.get("status") || undefined;

  try {
    const result = await orderService.findAll({ page, limit, status });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createOrderSchema.parse(json);

    // Fetch cart items
    const cart = await cartService.getCart(body.sessionId);
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.productVariant.product.price * item.quantity,
      0,
    );
    const total = subtotal;

    const orderData = {
      orderNumber,
      customerName: body.customerName,
      whatsappNumber: body.whatsappNumber,
      email: body.email,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      subtotal,
      total,
      items: {
        create: cart.items.map((item) => ({
          productVariantId: item.productVariantId,
          productName: item.productVariant.product.name,
          size: item.productVariant.size,
          color: item.productVariant.color,
          quantity: item.quantity,
          unitPrice: item.productVariant.product.price,
          totalPrice: item.productVariant.product.price * item.quantity,
        })),
      },
    };

    const order = await orderService.create(orderData);

    // Clear cart
    await cartService.clearCart(body.sessionId);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
