import { z } from "zod";

export const createBrandPhilosophySchema = z.object({
  brandId: z.string().uuid("Brand ID is required"),
  mission: z.string().optional(),
  vision: z.string().optional(),
  values: z.array(z.string()).default([]),
  story: z.string().optional(),
  heroImageUrl: z.string().url("Invalid URL").optional(),
});

export const updateBrandPhilosophySchema = z.object({
  mission: z.string().optional(),
  vision: z.string().optional(),
  values: z.array(z.string()).optional(),
  story: z.string().optional(),
  heroImageUrl: z.string().url("Invalid URL").optional(),
});
