import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// --- MOCK SETUP ---
const mockPrisma = {
  productVariant: {
    findMany: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

mock.module("@/lib/prisma", () => ({
  default: mockPrisma,
}));

const { productVariantService } = await import(
  "@/services/product-variant.service"
);

describe("ProductVariantService", () => {
  beforeEach(() => {
    mockPrisma.productVariant.findMany.mockReset();
    mockPrisma.productVariant.findUnique.mockReset();
    mockPrisma.productVariant.create.mockReset();
    mockPrisma.productVariant.update.mockReset();
    mockPrisma.productVariant.delete.mockReset();
  });

  describe("findByProductId", () => {
    it("should return variants for a product", async () => {
      // ARRANGE
      const mockVariants = [{ id: "1", sku: "SKU123" }];
      mockPrisma.productVariant.findMany.mockResolvedValue(mockVariants);

      // ACT
      const result = await productVariantService.findByProductId("p1");

      // ASSERT
      expect(result).toEqual(mockVariants);
      expect(mockPrisma.productVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: "p1", isActive: true } }),
      );
    });
  });

  describe("create", () => {
    it("should create variant with connect syntax", async () => {
      // ARRANGE
      const input = {
        productId: "p1",
        size: "M",
        color: "Red",
        sku: "SKU-RED-M",
      };
      const mockVariant = { id: "2", ...input };
      mockPrisma.productVariant.create.mockResolvedValue(mockVariant);

      // ACT
      const result = await productVariantService.create(input);

      // ASSERT
      expect(result).toEqual(mockVariant);
      // Verify that 'productId' was transformed into 'product: { connect: { id: ... } }'
      expect(mockPrisma.productVariant.create).toHaveBeenCalledWith({
        data: {
          product: { connect: { id: "p1" } },
          size: "M",
          color: "Red",
          colorHex: undefined,
          images: [],
          stock: 0,
          sku: "SKU-RED-M",
          isActive: true,
        },
      });
    });
  });
});
