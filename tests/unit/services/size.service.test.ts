import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// --- MOCK SETUP ---
const mockPrisma = {
  size: {
    findMany: mock(),
    count: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

mock.module("@/lib/prisma", () => ({
  default: mockPrisma,
}));

const { sizeService } = await import("@/services/size.service");

// --- TESTS ---
describe("SizeService", () => {
  beforeEach(() => {
    mockPrisma.size.findMany.mockReset();
    mockPrisma.size.count.mockReset();
    mockPrisma.size.findUnique.mockReset();
    mockPrisma.size.create.mockReset();
    mockPrisma.size.update.mockReset();
    mockPrisma.size.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated sizes", async () => {
      // ARRANGE
      const mockSizes = [{ id: "1", label: "M" }];
      mockPrisma.size.findMany.mockResolvedValue(mockSizes);
      mockPrisma.size.count.mockResolvedValue(1);

      // ACT
      const result = await sizeService.findAll({ page: 1, limit: 10 });

      // ASSERT
      expect(result.data).toEqual(mockSizes);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return size when found", async () => {
      // ARRANGE
      const mockSize = { id: "1", label: "M" };
      mockPrisma.size.findUnique.mockResolvedValue(mockSize);

      // ACT
      const result = await sizeService.findById("1");

      // ASSERT
      expect(result).toEqual(mockSize);
    });

    it("should throw NotFoundError when size not found", async () => {
      // ARRANGE
      mockPrisma.size.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await sizeService.findById("999");
      } catch (error: any) {
        expect(error.name).toBe("NotFoundError");
      }
    });
  });

  describe("create", () => {
    it("should create size successfully", async () => {
      // ARRANGE
      const input = { label: "L", sortOrder: 2 };
      const mockSize = { id: "2", ...input };
      mockPrisma.size.create.mockResolvedValue(mockSize);

      // ACT
      const result = await sizeService.create(input);

      // ASSERT
      expect(result).toEqual(mockSize);
      expect(mockPrisma.size.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe("update", () => {
    it("should update size successfully", async () => {
      // ARRANGE
      const input = { sortOrder: 3 };
      const mockSize = { id: "2", label: "L", sortOrder: 3 };
      mockPrisma.size.update.mockResolvedValue(mockSize);

      // ACT
      const result = await sizeService.update("2", input);

      // ASSERT
      expect(result).toEqual(mockSize);
    });
  });

  describe("delete", () => {
    it("should delete size successfully", async () => {
      // ARRANGE
      mockPrisma.size.delete.mockResolvedValue({ id: "1" });

      // ACT
      await sizeService.delete("1");

      // ASSERT
      expect(mockPrisma.size.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});
