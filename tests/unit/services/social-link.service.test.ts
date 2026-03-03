import { beforeEach, describe, expect, it, mock } from "bun:test";
import { setupServiceModule } from "./service-test.utils";

// --- MOCK SETUP ---
const mockPrisma = {
  socialLink: {
    findMany: mock(),
    count: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

const { socialLinkService } = await setupServiceModule<
  typeof import("@/services/social-link.service")
>({
  serviceSourcePath: "../../../src/services/social-link.service",
  prismaMock: mockPrisma,
});

// --- TESTS ---
describe("SocialLinkService", () => {
  beforeEach(() => {
    mockPrisma.socialLink.findMany.mockReset();
    mockPrisma.socialLink.count.mockReset();
    mockPrisma.socialLink.findUnique.mockReset();
    mockPrisma.socialLink.create.mockReset();
    mockPrisma.socialLink.update.mockReset();
    mockPrisma.socialLink.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated links", async () => {
      // ARRANGE
      const mockLinks = [{ id: "1", platform: "Twitter" }];
      mockPrisma.socialLink.findMany.mockResolvedValue(mockLinks);
      mockPrisma.socialLink.count.mockResolvedValue(1);

      // ACT
      const result = await socialLinkService.findAll({ page: 1, limit: 10 });

      // ASSERT
      expect(result.data).toEqual(mockLinks);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findById", () => {
    it("should return link when found", async () => {
      // ARRANGE
      const mockLink = { id: "1", platform: "Twitter" };
      mockPrisma.socialLink.findUnique.mockResolvedValue(mockLink);

      // ACT
      const result = await socialLinkService.findById("1");

      // ASSERT
      expect(result).toEqual(mockLink);
    });

    it("should throw NotFoundError when link not found", async () => {
      // ARRANGE
      mockPrisma.socialLink.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await socialLinkService.findById("999");
      } catch (error: unknown) {
        expect((error as Error).name).toBe("NotFoundError");
      }
    });
  });

  describe("create", () => {
    it("should create link successfully", async () => {
      // ARRANGE
      const input = {
        platform: "GitHub",
        url: "https://github.com",
        brandId: "b1",
      };
      const mockLink = { id: "2", ...input };
      mockPrisma.socialLink.create.mockResolvedValue(mockLink);

      // ACT
      // biome-ignore lint/suspicious/noExplicitAny: Intentional invalid input for test
      const result = await socialLinkService.create(input as any);

      // ASSERT
      expect(result).toEqual(mockLink);
      expect(mockPrisma.socialLink.create).toHaveBeenCalledWith({
        data: input,
      });
    });
  });

  describe("update", () => {
    it("should update link successfully", async () => {
      // ARRANGE
      const input = { url: "https://x.com" };
      const mockLink = { id: "1", platform: "Twitter", url: "https://x.com" };
      mockPrisma.socialLink.update.mockResolvedValue(mockLink);

      // ACT
      const result = await socialLinkService.update("1", input);

      // ASSERT
      expect(result).toEqual(mockLink);
    });
  });

  describe("delete", () => {
    it("should delete link successfully", async () => {
      // ARRANGE
      mockPrisma.socialLink.delete.mockResolvedValue({ id: "1" });

      // ACT
      await socialLinkService.delete("1");

      // ASSERT
      expect(mockPrisma.socialLink.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});
