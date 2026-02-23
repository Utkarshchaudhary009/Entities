"use client";

import type { z } from "zod";
import type {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/category";
import { createEntityStore } from "@/stores/factory";
import type { ApiCategory } from "@/types/api";

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const useCategoryStore = createEntityStore<
  ApiCategory,
  CreateCategoryInput,
  UpdateCategoryInput
>("category-store", "/api/categories");
