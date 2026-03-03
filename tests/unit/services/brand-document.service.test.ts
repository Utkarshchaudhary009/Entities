import { beforeEach, describe, expect, it, mock } from "bun:test";
import { setupServiceModule } from "./service-test.utils";

// --- MOCK SETUP ---
const mockPrisma = {
  brandDocument: {
    findMany: mock(),
    count: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

const { brandDocumentService } = await setupServiceModule<
  typeof import("@/services/brand-document.service")
>({
  serviceSourcePath: "../../../src/services/brand-document.service",
  prismaMock: mockPrisma,
});

// --- TESTS ---
describe("BrandDocumentService", () => {
  beforeEach(() => {
    mockPrisma.brandDocument.findMany.mockReset();
    mockPrisma.brandDocument.count.mockReset();
    mockPrisma.brandDocument.findUnique.mockReset();
    mockPrisma.brandDocument.create.mockReset();
    mockPrisma.brandDocument.update.mockReset();
    mockPrisma.brandDocument.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated documents filtered by type", async () => {
      // ARRANGE
      const mockDocs = [{ id: "1", type: "PRIVACY_POLICY" }];
      mockPrisma.brandDocument.findMany.mockResolvedValue(mockDocs);
      mockPrisma.brandDocument.count.mockResolvedValue(1);

      // ACT
      const result = await brandDocumentService.findAll({
        page: 1,
        limit: 10,
        type: "PRIVACY_POLICY",
      });

      // ASSERT
      expect(result.data).toEqual(mockDocs);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.brandDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "PRIVACY_POLICY" }),
        }),
      );
    });
  });

  describe("findById", () => {
    it("should return document when found", async () => {
      // ARRANGE
      const mockDoc = { id: "1", type: "TERMS" };
      mockPrisma.brandDocument.findUnique.mockResolvedValue(mockDoc);

      // ACT
      const result = await brandDocumentService.findById("1");

      // ASSERT
      expect(result).toEqual(mockDoc);
    });

    it("should throw NotFoundError when document not found", async () => {
      // ARRANGE
      mockPrisma.brandDocument.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await brandDocumentService.findById("999");
      } catch (error: unknown) {
        expect((error as Error).name).toBe("NotFoundError");
      }
    });
  });

  describe("create", () => {
    it("should create document successfully", async () => {
      // ARRANGE
      const input = {
        type: "PRIVACY_POLICY",
        content: "test",
        brandId: "b1",
      };
      const mockDoc = { id: "1", ...input };
      mockPrisma.brandDocument.create.mockResolvedValue(mockDoc);

      // ACT
      // biome-ignore lint/suspicious/noExplicitAny: Intentional invalid input for test
      const result = await brandDocumentService.create(input as any);

      // ASSERT
      expect(result).toEqual(mockDoc);
    });
  });

  describe("update", () => {
    it("should update document successfully", async () => {
      // ARRANGE
      const input = { content: "updated" };
      const mockDoc = { id: "1", content: "updated" };
      mockPrisma.brandDocument.update.mockResolvedValue(mockDoc);

      // ACT
      const result = await brandDocumentService.update("1", input);

      // ASSERT
      expect(result).toEqual(mockDoc);
    });
  });

  describe("delete", () => {
    it("should delete document successfully", async () => {
      // ARRANGE
      mockPrisma.brandDocument.delete.mockResolvedValue({ id: "1" });

      // ACT
      await brandDocumentService.delete("1");

      // ASSERT
      expect(mockPrisma.brandDocument.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});
