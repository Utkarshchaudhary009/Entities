import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Discount } from "@/generated/prisma/client";

interface DiscountStoreState {
  discounts: Discount[];
  discount: Discount | null;
  isLoading: boolean;
  error: string | null;

  setDiscounts: (discounts: Discount[]) => void;
  setDiscount: (discount: Discount | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchDiscounts: (params?: any) => Promise<void>;
  createDiscount: (data: any) => Promise<void>;
  updateDiscount: (id: string, data: any) => Promise<void>;
  deleteDiscount: (id: string) => Promise<void>;
}

export const useDiscountStore = create<DiscountStoreState>()(
  devtools(
    (set, get) => ({
      discounts: [],
      discount: null,
      isLoading: false,
      error: null,

      setDiscounts: (discounts) => set({ discounts }),
      setDiscount: (discount) => set({ discount }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchDiscounts: async (params) => {
        set({ isLoading: true });
        try {
          const query = new URLSearchParams(params).toString();
          const res = await fetch(`/api/discounts?${query}`);
          if (!res.ok) throw new Error("Failed to fetch discounts");
          const json = await res.json();
          set({ discounts: json.data ?? [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      createDiscount: async (data) => {
        const tempId = `temp-${Date.now()}`;
        const optimistic = { ...data, id: tempId } as Discount;
        set((state) => ({ discounts: [...state.discounts, optimistic] }));

        try {
            const res = await fetch("/api/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to create discount");
            const json = await res.json();
            set((state) => ({
                discounts: state.discounts.map(d => d.id === tempId ? json : d)
            }));
        } catch (err: any) {
            set((state) => ({ discounts: state.discounts.filter(d => d.id !== tempId), error: err.message }));
        }
      },

      updateDiscount: async (id, data) => {
         const prev = get().discounts;
         const prevDiscount = prev.find(d => d.id === id);
         
         if (prevDiscount) {
            const updated = { ...prevDiscount, ...data } as Discount;
            set({ discounts: prev.map(d => d.id === id ? updated : d) });
         }

         try {
            const res = await fetch(`/api/discounts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update discount");
            const json = await res.json();
            set((state) => ({
                discounts: state.discounts.map(d => d.id === id ? json : d)
            }));
         } catch (err: any) {
            set({ discounts: prev, error: err.message });
         }
      },

      deleteDiscount: async (id) => {
         const prev = get().discounts;
         set({ discounts: prev.filter(d => d.id !== id) });

         try {
            const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete discount");
         } catch (err: any) {
            set({ discounts: prev, error: err.message });
         }
      }
    }),
    { name: "discount-store" }
  )
);
