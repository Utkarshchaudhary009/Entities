"use client";

import type { z } from "zod";
import type {
  createDiscountSchema,
  updateDiscountSchema,
} from "@/lib/validations/discount";
import { createEntityStore } from "@/stores/factory";
import type { ApiDiscount } from "@/types/api";

type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;

export const useDiscountStore = createEntityStore<
  ApiDiscount,
  CreateDiscountInput,
  UpdateDiscountInput
>("discount-store", "/api/discounts");
