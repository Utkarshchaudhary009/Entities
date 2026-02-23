import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// --- MOCK SETUP ---
const mockPrisma = {
  discount: {
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
const { discountService } = await import("@/services/discount.service");

// --- TESTS ---
describe("DiscountService", () => {
  beforeEach(() => {
    mockPrisma.discount.findMany.mockReset();
    mockPrisma.discount.count.mockReset();
    mockPrisma.discount.findUnique.mockReset();
    mockPrisma.discount.create.mockReset();
    mockPrisma.discount.update.mockReset();
    mockPrisma.discount.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated discounts", async () => {
      // ARRANGE
      const mockDiscounts = [{ id: "1", code: "SALE20" }];
      mockPrisma.discount.findMany.mockResolvedValue(mockDiscounts);
      mockPrisma.discount.count.mockResolvedValue(1);

      // ACT
      const result = await discountService.findAll({ page: 1, limit: 10 });

      // ASSERT
      expect(result.data).toEqual(mockDiscounts);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return discount when found", async () => {
      // ARRANGE
      const mockDiscount = { id: "1", code: "SALE20" };
      mockPrisma.discount.findUnique.mockResolvedValue(mockDiscount);

      // ACT
      const result = await discountService.findById("1");

      // ASSERT
      expect(result).toEqual(mockDiscount);
    });

    it("should throw NotFoundError when discount not found", async () => {
      // ARRANGE
      mockPrisma.discount.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await discountService.findById("999");
      } catch (error: any) {
        expect(error.name).toBe("NotFoundError");
        expect(error.message).toContain("Discount");
      }
    });
  });

  describe("create", () => {
    it("should create discount successfully", async () => {
      // ARRANGE
      const input = {
        code: "SALE20",
        value: 20,
        discountType: "PERCENTAGE",
      };
      const mockDiscount = { id: "2", ...input };
      mockPrisma.discount.create.mockResolvedValue(mockDiscount);

      // ACT
      const result = await discountService.create(input);

      // ASSERT
      expect(result).toEqual(mockDiscount);
      expect(mockPrisma.discount.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe("update", () => {
    it("should update discount successfully", async () => {
      // ARRANGE
      const input = { value: 25 };
      const mockDiscount = { id: "1", code: "SALE20", value: 25 };
      mockPrisma.discount.update.mockResolvedValue(mockDiscount);

      // ACT
      const result = await discountService.update("1", input);

      // ASSERT
      expect(result).toEqual(mockDiscount);
      expect(mockPrisma.discount.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: input,
      });
    });
  });

  describe("delete", () => {
    it("should delete discount successfully", async () => {
      // ARRANGE
      mockPrisma.discount.delete.mockResolvedValue({ id: "1" });

      // ACT
      await discountService.delete("1");

      // ASSERT
      expect(mockPrisma.discount.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});
