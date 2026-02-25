import { z } from "zod";

export const createColorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  hex: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid HEX color"),
  sortOrder: z.number().int().optional(),
});

export const updateColorSchema = createColorSchema.partial();
