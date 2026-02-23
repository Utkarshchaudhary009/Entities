"use client";

import type { z } from "zod";
import type {
  createColorSchema,
  updateColorSchema,
} from "@/lib/validations/color";
import { createEntityStore } from "@/stores/factory";
import type { ApiColor } from "@/types/api";

type CreateColorInput = z.infer<typeof createColorSchema>;
type UpdateColorInput = z.infer<typeof updateColorSchema>;

export const useColorStore = createEntityStore<
  ApiColor,
  CreateColorInput,
  UpdateColorInput
>("color-store", "/api/colors");
