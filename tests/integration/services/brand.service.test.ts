import { beforeAll, describe, expect, it } from "bun:test";
import { brandService } from "@/services/brand.service";
import { resetDb, prisma } from "../../../helpers/reset-db";

describe("BrandService Integration", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("should create brand with founder", async () => {
    // ARRANGE
    const founder = await prisma.founder.create({ data: { name: "Phil Knight" } });

    // ACT
    const brand = await brandService.create({
      name: "Nike",
      founderId: founder.id,
    });

    // ASSERT
    const saved = await brandService.findById(brand.id);
    expect(saved.founder?.name).toBe("Phil Knight");
  });
});
