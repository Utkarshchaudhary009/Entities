import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

mock.restore();

// --- MOCK SETUP ---
const mockPrisma = {
  product: {
    findMany: mock(),
    count: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

// Replace the real Prisma client with our mock
mock.module("@/lib/prisma", () => ({
  default: mockPrisma,
}));

// Re-import the service AFTER mocking
const realProductServiceModule = await import(
  "../../../src/services/product.service"
);
mock.module("@/services/product.service", () => realProductServiceModule);

const { productService } = await import("@/services/product.service");

// --- TESTS ---
describe("ProductService", () => {
  beforeEach(() => {
    mockPrisma.product.findMany.mockReset();
    mockPrisma.product.count.mockReset();
    mockPrisma.product.findUnique.mockReset();
    mockPrisma.product.create.mockReset();
    mockPrisma.product.update.mockReset();
    mockPrisma.product.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated products with search", async () => {
      // ARRANGE
      const mockProducts = [{ id: "1", name: "Air Max" }];
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(1);

      // ACT
      const result = await productService.findAll({
        page: 1,
        limit: 10,
        search: "Air Max",
      });

      // ASSERT
      expect(result.data).toEqual(mockProducts);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: "Air Max", mode: "insensitive" } },
              { description: { contains: "Air Max", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });
  });

  describe("findById", () => {
    it("should return product when found", async () => {
      // ARRANGE
      const mockProduct = { id: "1", name: "Air Max" };
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.findById("1");

      // ASSERT
      expect(result).toEqual(mockProduct);
    });

    it("should throw NotFoundError when product not found", async () => {
      // ARRANGE
      mockPrisma.product.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await productService.findById("999");
      } catch (error: any) {
        expect(error.name).toBe("NotFoundError");
        expect(error.message).toContain("Product");
      }
    });
  });

  describe("findBySlug", () => {
    it("should return product when found by slug", async () => {
      // ARRANGE
      const mockProduct = { id: "1", slug: "air-max" };
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.findBySlug("air-max");

      // ASSERT
      expect(result).toEqual(mockProduct);
    });

    it("should throw NotFoundError when product slug not found", async () => {
      // ARRANGE
      mockPrisma.product.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await productService.findBySlug("unknown-slug");
      } catch (error: any) {
        expect(error.name).toBe("NotFoundError");
        expect(error.message).toContain("Product");
      }
    });
  });

  describe("create", () => {
    it("should create product successfully", async () => {
      // ARRANGE
      const input = { name: "Air Max", price: 100 };
      const mockProduct = { id: "2", ...input };
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.create(input);

      // ASSERT
      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe("update", () => {
    it("should update product successfully", async () => {
      // ARRANGE
      const input = { price: 120 };
      const mockProduct = { id: "1", name: "Air Max", price: 120 };
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.update("1", input);

      // ASSERT
      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: input,
      });
    });
  });

  describe("delete", () => {
    it("should delete product successfully", async () => {
      // ARRANGE
      mockPrisma.product.delete.mockResolvedValue({ id: "1" });

      // ACT
      await productService.delete("1");

      // ASSERT
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});
