import { z } from "zod";

export const createFounderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(0).optional(),
  story: z.string().optional(),
  education: z.string().optional(),
  quote: z.string().optional(),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
});

export const updateFounderSchema = createFounderSchema.partial();
