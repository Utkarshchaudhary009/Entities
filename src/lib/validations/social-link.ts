import { z } from "zod";

const baseSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Invalid URL"),
  isActive: z.boolean().default(true),
  brandId: z.string().uuid("Brand ID must be a valid UUID").optional(),
  founderId: z.string().uuid("Founder ID must be a valid UUID").optional(),
});

export const createSocialLinkSchema = baseSchema.refine(
  (data) => data.brandId || data.founderId,
  {
    message: "Either brandId or founderId must be provided",
    path: ["brandId", "founderId"],
  },
);

export const updateSocialLinkSchema = baseSchema.partial();
