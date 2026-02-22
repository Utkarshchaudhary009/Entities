import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Order, OrderItem } from "@/generated/prisma/client";
import { OrderStatus } from "@/types/domain";

interface OrderStoreState {
  orders: Order[];
  order: Order | null;
  isLoading: boolean;
  error: string | null;

  setOrders: (orders: Order[]) => void;
  setOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchOrders: (params?: any) => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
}

export const useOrderStore = create<OrderStoreState>()(
  devtools(
    (set, get) => ({
      orders: [],
      order: null,
      isLoading: false,
      error: null,

      setOrders: (orders) => set({ orders }),
      setOrder: (order) => set({ order }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchOrders: async (params) => {
        set({ isLoading: true });
        try {
          const query = new URLSearchParams(params).toString();
          const res = await fetch(`/api/orders?${query}`);
          if (!res.ok) throw new Error("Failed to fetch orders");
          const json = await res.json();
          set({ orders: json.data ?? [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchOrder: async (id) => {
         // Check cache
         const cached = get().orders.find(o => o.id === id);
         if (cached) set({ order: cached });
         else set({ isLoading: true });

         try {
            const res = await fetch(`/api/orders/${id}`);
            if (!res.ok) throw new Error("Failed to fetch order");
            const json = await res.json();
            set({ order: json, isLoading: false });
         } catch (err: any) {
            set({ error: err.message, isLoading: false });
         }
      },

      updateOrderStatus: async (id, status) => {
         const prevOrders = get().orders;
         const prevOrder = get().order;

         // Optimistic
         if (prevOrder && prevOrder.id === id) {
            set({ order: { ...prevOrder, status } });
         }
         
         const orderIndex = prevOrders.findIndex(o => o.id === id);
         if (orderIndex >= 0) {
            const newOrders = [...prevOrders];
            newOrders[orderIndex] = { ...newOrders[orderIndex], status };
            set({ orders: newOrders });
         }

         try {
            const res = await fetch(`/api/orders/${id}`, {
                method: "PUT", // or PATCH for status
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Failed to update order status");
            const json = await res.json();
            const updated = json;
            
            // Reconcile with server data
            if (get().order?.id === id) set({ order: updated });
            set(state => ({
               orders: state.orders.map(o => o.id === id ? updated : o)
            }));
         } catch (err: any) {
            // Revert
            set({ orders: prevOrders, order: prevOrder, error: err.message });
         }
      }
    }),
    { name: "order-store" }
  )
);
