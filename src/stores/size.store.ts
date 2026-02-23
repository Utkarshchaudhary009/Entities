"use client";

import type { z } from "zod";
import type {
  createSizeSchema,
  updateSizeSchema,
} from "@/lib/validations/size";
import { createEntityStore } from "@/stores/factory";
import type { ApiSize } from "@/types/api";

type CreateSizeInput = z.infer<typeof createSizeSchema>;
type UpdateSizeInput = z.infer<typeof updateSizeSchema>;

export const useSizeStore = createEntityStore<
  ApiSize,
  CreateSizeInput,
  UpdateSizeInput
>("size-store", "/api/sizes");
