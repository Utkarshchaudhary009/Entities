import { beforeEach, describe, expect, it, mock } from "bun:test";
import { setupServiceModule } from "./service-test.utils";

// --- MOCK SETUP ---
const mockPrisma = {
  founder: {
    findMany: mock(),
    count: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

const { founderService } = await setupServiceModule<
  typeof import("@/services/founder.service")
>({
  serviceSourcePath: "../../../src/services/founder.service",
  prismaMock: mockPrisma,
});

// --- TESTS ---
describe("FounderService", () => {
  beforeEach(() => {
    mockPrisma.founder.findMany.mockReset();
    mockPrisma.founder.count.mockReset();
    mockPrisma.founder.findUnique.mockReset();
    mockPrisma.founder.create.mockReset();
    mockPrisma.founder.update.mockReset();
    mockPrisma.founder.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated founders", async () => {
      // ARRANGE
      const mockFounders = [{ id: "1", name: "Steve Jobs" }];
      mockPrisma.founder.findMany.mockResolvedValue(mockFounders);
      mockPrisma.founder.count.mockResolvedValue(1);

      // ACT
      const result = await founderService.findAll({ page: 1, limit: 10 });

      // ASSERT
      expect(result.data).toEqual(mockFounders);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return founder when found", async () => {
      // ARRANGE
      const mockFounder = { id: "1", name: "Steve Jobs" };
      mockPrisma.founder.findUnique.mockResolvedValue(mockFounder);

      // ACT
      const result = await founderService.findById("1");

      // ASSERT
      expect(result).toEqual(mockFounder);
    });

    it("should throw NotFoundError when founder not found", async () => {
      // ARRANGE
      mockPrisma.founder.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await founderService.findById("999");
      } catch (error: unknown) {
        expect((error as Error).name).toBe("NotFoundError");
      }
    });
  });

  describe("create", () => {
    it("should create founder successfully", async () => {
      // ARRANGE
      const input = { name: "Bill Gates", age: 60 };
      const mockFounder = { id: "2", ...input };
      mockPrisma.founder.create.mockResolvedValue(mockFounder);

      // ACT
      const result = await founderService.create(input);

      // ASSERT
      expect(result).toEqual(mockFounder);
      expect(mockPrisma.founder.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe("update", () => {
    it("should update founder successfully", async () => {
      // ARRANGE
      const input = { age: 65 };
      const mockFounder = { id: "2", name: "Bill Gates", age: 65 };
      mockPrisma.founder.update.mockResolvedValue(mockFounder);

      // ACT
      const result = await founderService.update("2", input);

      // ASSERT
      expect(result).toEqual(mockFounder);
    });
  });

  describe("delete", () => {
    it("should delete founder successfully", async () => {
      // ARRANGE
      mockPrisma.founder.delete.mockResolvedValue({ id: "1" });

      // ACT
      await founderService.delete("1");

      // ASSERT
      expect(mockPrisma.founder.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});
