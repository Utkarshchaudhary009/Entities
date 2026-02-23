import { beforeAll, describe, expect, it } from "bun:test";
import { cartService } from "@/services/cart.service";
import { prisma, resetDb } from "../../helpers/reset-db";

describe("CartService Integration", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("should handle cart item upserts", async () => {
    // ARRANGE
    const category = await prisma.category.create({
      data: { name: "C", slug: "c" },
    });
    const product = await prisma.product.create({
      data: { name: "P", slug: "p", price: 10, categoryId: category.id },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, size: "S", color: "B", stock: 100 },
    });

    // ACT 1: Add Item
    const item1 = await cartService.addItem("sess_1", variant.id, 1);
    expect(item1.quantity).toBe(1);

    // ACT 2: Add Same Item (Should Upsert/Increment)
    const item2 = await cartService.addItem("sess_1", variant.id, 2);
    expect(item2.quantity).toBe(3); // 1 + 2

    // ASSERT: Verify DB
    const cart = await prisma.cart.findUnique({
      where: { sessionId: "sess_1" },
      include: { items: true },
    });
    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0].quantity).toBe(3);
  });
});
