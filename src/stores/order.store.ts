"use client";

import type { z } from "zod";
import type {
  createOrderSchema,
  updateOrderDetailsSchema,
} from "@/lib/validations/order";
import { createEntityStore } from "@/stores/factory";
import type { ApiOrder } from "@/types/api";
import type { OrderStatus } from "@/types/domain";

type CreateOrderInput = z.infer<typeof createOrderSchema>;
type UpdateOrderDetailsInput = z.infer<typeof updateOrderDetailsSchema>;

export const useOrderStore = createEntityStore<
  ApiOrder,
  CreateOrderInput,
  UpdateOrderDetailsInput,
  {
    updateOrderDetails: (
      id: string,
      data: UpdateOrderDetailsInput,
    ) => Promise<void>;
  }
>("order-store", "/api/orders", (_set, get) => ({
  updateOrderDetails: async (id, data) => {
    await get().update(id, data);
  },
}));
