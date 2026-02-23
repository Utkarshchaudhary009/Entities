import { z } from "zod";

export const createSocialLinkSchema = z
  .object({
    platform: z.string().min(1, "Platform is required"),
    url: z.string().url("Invalid URL"),
    isActive: z.boolean().default(true),
    brandId: z.string().uuid("Brand ID must be a valid UUID").optional(),
    founderId: z.string().uuid("Founder ID must be a valid UUID").optional(),
  })
  .refine(
    (data: { brandId?: string; founderId?: string }) =>
      data.brandId || data.founderId,
    {
      message: "Either brandId or founderId must be provided",
      path: ["brandId", "founderId"],
    },
  );

export const updateSocialLinkSchema = createSocialLinkSchema.partial();
