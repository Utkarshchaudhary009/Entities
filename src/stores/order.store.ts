"use client";

import type { z } from "zod";
import type {
  createOrderSchema,
  updateOrderStatusSchema,
} from "@/lib/validations/order";
import { createEntityStore } from "@/stores/factory";
import type { ApiOrder } from "@/types/api";
import type { OrderStatus } from "@/types/domain";

type CreateOrderInput = z.infer<typeof createOrderSchema>;
type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const useOrderStore = createEntityStore<
  ApiOrder,
  CreateOrderInput,
  UpdateOrderStatusInput,
  { updateOrderStatus: (id: string, status: OrderStatus) => Promise<void> }
>("order-store", "/api/orders", (_set, get) => ({
  updateOrderStatus: async (id, status) => {
    await get().update(id, { status });
  },
}));
