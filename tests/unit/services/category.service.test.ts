import { beforeEach, describe, expect, it, mock } from "bun:test";
import { setupServiceModule } from "./service-test.utils";

// --- MOCK SETUP ---
const mockPrisma = {
  category: {
    findMany: mock(),
    count: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

// Replace the real Prisma client with our mock
const { categoryService } = await setupServiceModule<
  typeof import("@/services/category.service")
>({
  serviceSourcePath: "../../../src/services/category.service",
  prismaMock: mockPrisma,
});

// --- TESTS ---
describe("CategoryService", () => {
  beforeEach(() => {
    mockPrisma.category.findMany.mockReset();
    mockPrisma.category.count.mockReset();
    mockPrisma.category.findUnique.mockReset();
    mockPrisma.category.create.mockReset();
    mockPrisma.category.update.mockReset();
    mockPrisma.category.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated categories", async () => {
      // ARRANGE
      const mockCategories = [{ id: "1", name: "Shoes" }];
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);
      mockPrisma.category.count.mockResolvedValue(1);

      // ACT
      const result = await categoryService.findAll({ page: 1, limit: 10 });

      // ASSERT
      expect(result.data).toEqual(mockCategories);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return category when found", async () => {
      // ARRANGE
      const mockCategory = { id: "1", name: "Shoes" };
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

      // ACT
      const result = await categoryService.findById("1");

      // ASSERT
      expect(result).toEqual(mockCategory);
    });

    it("should throw NotFoundError when category not found", async () => {
      // ARRANGE
      mockPrisma.category.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await categoryService.findById("999");
      } catch (error: any) {
        expect(error.name).toBe("NotFoundError");
        expect(error.message).toContain("Category");
      }
    });
  });

  describe("create", () => {
    it("should create category successfully", async () => {
      // ARRANGE
      const input = { name: "Clothing", slug: "clothing" };
      const mockCategory = { id: "2", ...input };
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      // ACT
      const result = await categoryService.create(input);

      // ASSERT
      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe("update", () => {
    it("should update category successfully", async () => {
      // ARRANGE
      const input = { name: "Updated Clothing" };
      const mockCategory = {
        id: "2",
        name: "Updated Clothing",
        slug: "clothing",
      };
      mockPrisma.category.update.mockResolvedValue(mockCategory);

      // ACT
      const result = await categoryService.update("2", input);

      // ASSERT
      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: "2" },
        data: input,
      });
    });
  });

  describe("delete", () => {
    it("should delete category successfully", async () => {
      // ARRANGE
      mockPrisma.category.delete.mockResolvedValue({ id: "1" });

      // ACT
      await categoryService.delete("1");

      // ASSERT
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});
