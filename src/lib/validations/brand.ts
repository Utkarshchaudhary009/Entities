import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().url("Invalid logo URL").optional(),
  tagline: z.string().optional(),
  brandStory: z.string().optional(),
  supportEmail: z.string().email("Invalid support email").optional(),
  supportPhone: z.string().optional(),
  isActive: z.boolean().default(true),
  founderId: z.string().uuid("Founder ID must be a valid UUID"),
});

export const updateBrandSchema = createBrandSchema.partial();
