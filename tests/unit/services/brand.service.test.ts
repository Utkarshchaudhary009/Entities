import { beforeEach, describe, expect, it, mock } from "bun:test";
import { setupServiceModule } from "./service-test.utils";

// --- MOCK SETUP ---
const mockPrisma = {
  brand: {
    findMany: mock(),
    count: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
};

// Replace the real Prisma client with our mock
const { brandService } = await setupServiceModule<
  typeof import("@/services/brand.service")
>({
  serviceSourcePath: "../../../src/services/brand.service",
  prismaMock: mockPrisma,
});

// --- TESTS ---
describe("BrandService", () => {
  beforeEach(() => {
    mockPrisma.brand.findMany.mockReset();
    mockPrisma.brand.count.mockReset();
    mockPrisma.brand.findUnique.mockReset();
    mockPrisma.brand.create.mockReset();
    mockPrisma.brand.update.mockReset();
    mockPrisma.brand.delete.mockReset();
  });

  describe("findAll", () => {
    it("should return paginated brands with search", async () => {
      // ARRANGE
      const mockBrands = [{ id: "1", name: "Nike" }];
      mockPrisma.brand.findMany.mockResolvedValue(mockBrands);
      mockPrisma.brand.count.mockResolvedValue(1);

      // ACT
      const result = await brandService.findAll({
        page: 1,
        limit: 10,
        search: "Nike",
      });

      // ASSERT
      expect(result.data).toEqual(mockBrands);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: "Nike", mode: "insensitive" } },
              { tagline: { contains: "Nike", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });
  });

  describe("findById", () => {
    it("should return brand when found", async () => {
      // ARRANGE
      const mockBrand = { id: "1", name: "Nike" };
      mockPrisma.brand.findUnique.mockResolvedValue(mockBrand);

      // ACT
      const result = await brandService.findById("1");

      // ASSERT
      expect(result).toEqual(mockBrand);
    });

    it("should throw NotFoundError when brand not found", async () => {
      // ARRANGE
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(brandService.findById("999")).rejects.toMatchObject({
        name: "NotFoundError",
      });
    });
  });

  describe("create", () => {
    it("should create brand successfully", async () => {
      // ARRANGE
      const input = { name: "Adidas", founderId: "f1" };
      const mockBrand = { id: "2", ...input };
      mockPrisma.brand.create.mockResolvedValue(mockBrand);

      // ACT
      const result = await brandService.create(input);

      // ASSERT
      expect(result).toEqual(mockBrand);
      expect(mockPrisma.brand.create).toHaveBeenCalledWith({ data: input });
    });
  });
});
