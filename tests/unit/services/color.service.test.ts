import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// --- MOCK SETUP ---
const mockPrisma = {
  color: {
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

const { colorService } = await import("@/services/color.service");

// --- TESTS ---
describe("ColorService", () => {
  beforeEach(() => {
    mockPrisma.color.findMany.mockReset();
    mockPrisma.color.count.mockReset();
    mockPrisma.color.findUnique.mockReset();
    mockPrisma.color.create.mockReset();
    mockPrisma.color.update.mockReset();
    mockPrisma.color.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated colors", async () => {
      // ARRANGE
      const mockColors = [{ id: "1", name: "Red", hex: "#FF0000" }];
      mockPrisma.color.findMany.mockResolvedValue(mockColors);
      mockPrisma.color.count.mockResolvedValue(1);

      // ACT
      const result = await colorService.findAll({ page: 1, limit: 10 });

      // ASSERT
      expect(result.data).toEqual(mockColors);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return color when found", async () => {
      // ARRANGE
      const mockColor = { id: "1", name: "Red" };
      mockPrisma.color.findUnique.mockResolvedValue(mockColor);

      // ACT
      const result = await colorService.findById("1");

      // ASSERT
      expect(result).toEqual(mockColor);
    });

    it("should throw NotFoundError when color not found", async () => {
      // ARRANGE
      mockPrisma.color.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await colorService.findById("999");
      } catch (error: any) {
        expect(error.name).toBe("NotFoundError");
      }
    });
  });

  describe("create", () => {
    it("should create color successfully", async () => {
      // ARRANGE
      const input = { name: "Blue", hex: "#0000FF" };
      const mockColor = { id: "2", ...input };
      mockPrisma.color.create.mockResolvedValue(mockColor);

      // ACT
      const result = await colorService.create(input);

      // ASSERT
      expect(result).toEqual(mockColor);
      expect(mockPrisma.color.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe("update", () => {
    it("should update color successfully", async () => {
      // ARRANGE
      const input = { hex: "#0000AA" };
      const mockColor = { id: "2", name: "Blue", hex: "#0000AA" };
      mockPrisma.color.update.mockResolvedValue(mockColor);

      // ACT
      const result = await colorService.update("2", input);

      // ASSERT
      expect(result).toEqual(mockColor);
    });
  });

  describe("delete", () => {
    it("should delete color successfully", async () => {
      // ARRANGE
      mockPrisma.color.delete.mockResolvedValue({ id: "1" });

      // ACT
      await colorService.delete("1");

      // ASSERT
      expect(mockPrisma.color.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});
