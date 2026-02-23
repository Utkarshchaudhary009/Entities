import { beforeAll, describe, expect, it } from "bun:test";
import { productService } from "@/services/product.service";
import { prisma, resetDb } from "../../../helpers/reset-db";

describe("ProductService Integration", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("should create product with category relation", async () => {
    // ARRANGE
    const category = await prisma.category.create({
      data: { name: "Sneakers", slug: "sneakers" },
    });

    // ACT
    const product = await productService.create({
      name: "Air Jordan",
      slug: "air-jordan",
      price: 200,
      categoryId: category.id,
    });

    // ASSERT
    const saved = await productService.findById(product.id);
    expect(saved.category?.name).toBe("Sneakers");
  });

  it("should fail on duplicate slug", async () => {
    // ACT & ASSERT
    try {
      await productService.create({
        name: "Duplicate",
        slug: "air-jordan", // Already exists
        price: 100,
      });
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e.code).toBe("P2002"); // Prisma Unique Constraint Violation
    }
  });
});
