import { z } from "zod";

export const createSizeSchema = z.object({
  label: z.string().min(1, "Label is required"),
  sortOrder: z.number().int().optional(),
  measurements: z.record(z.string(), z.any()).optional(),
});

export const updateSizeSchema = createSizeSchema.partial();
