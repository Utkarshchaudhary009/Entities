import { beforeAll, describe, expect, it } from "bun:test";
import { orderService } from "@/services/order.service";
import { prisma, resetDb } from "../../../helpers/reset-db";

describe("OrderService Integration", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("should create an order and decrement stock atomically", async () => {
    // ARRANGE: Seed DB
    const category = await prisma.category.create({
      data: { name: "Test Cat", slug: "test-cat" },
    });

    const product = await prisma.product.create({
      data: {
        name: "Test Product",
        slug: "test-prod",
        price: 100,
        categoryId: category.id,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        size: "M",
        color: "Red",
        sku: "TEST-SKU",
        stock: 10,
      },
    });

    // ACT: Create Order
    const orderInput = {
      orderNumber: "ORD-001",
      clerkId: "user_1",
      customerName: "Test User",
      whatsappNumber: "+1234567890",
      address: "123 St",
      city: "City",
      state: "State",
      pincode: "12345",
      subtotal: 100,
      total: 100,
      items: [
        {
          productVariantId: variant.id,
          productName: product.name,
          size: "M",
          color: "Red",
          quantity: 2,
          unitPrice: 100,
          totalPrice: 200,
        },
      ],
    };

    const order = await orderService.create(orderInput);

    // ASSERT: Verify Order
    const savedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    expect(savedOrder).toBeDefined();
    expect(savedOrder?.items).toHaveLength(1);

    // ASSERT: Verify Stock Decrement
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: variant.id },
    });
    expect(updatedVariant?.stock).toBe(8); // 10 - 2
  });

  it("should fail validation if stock is insufficient and NOT modify DB", async () => {
    // ARRANGE: Use same variant (now stock 8)
    const variant = await prisma.productVariant.findFirst({
      where: { sku: "TEST-SKU" },
    });
    if (!variant) throw new Error("Variant not found");

    const orderInput = {
      orderNumber: "ORD-002",
      customerName: "Fail User",
      whatsappNumber: "+1234567890",
      address: "123 St",
      city: "City",
      state: "State",
      pincode: "12345",
      subtotal: 1000,
      total: 1000,
      items: [
        {
          productVariantId: variant.id,
          productName: "Test Product",
          size: "M",
          color: "Red",
          quantity: 100, // Requesting more than 8
          unitPrice: 100,
          totalPrice: 10000,
        },
      ],
    };

    // ACT & ASSERT
    try {
      await orderService.create(orderInput);
      expect(true).toBe(false); // Should fail if no error thrown
    } catch (e: any) {
      expect(e.message).toContain("Insufficient stock");
    }

    // ASSERT: Stock should still be 8
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: variant.id },
    });
    expect(updatedVariant?.stock).toBe(8);
  });
});
