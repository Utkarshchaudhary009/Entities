import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Size, Color } from "@/generated/prisma/client";

interface AttributeStoreState {
  sizes: Size[];
  colors: Color[];
  isLoading: boolean;
  error: string | null;

  setSizes: (sizes: Size[]) => void;
  setColors: (colors: Color[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchSizes: () => Promise<void>;
  fetchColors: () => Promise<void>;
  
  createSize: (data: any) => Promise<void>;
  updateSize: (id: string, data: any) => Promise<void>;
  deleteSize: (id: string) => Promise<void>;
  
  createColor: (data: any) => Promise<void>;
  updateColor: (id: string, data: any) => Promise<void>;
  deleteColor: (id: string) => Promise<void>;
}

export const useAttributeStore = create<AttributeStoreState>()(
  devtools(
    (set, get) => ({
      sizes: [],
      colors: [],
      isLoading: false,
      error: null,

      setSizes: (sizes) => set({ sizes }),
      setColors: (colors) => set({ colors }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchSizes: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/sizes`);
          if (!res.ok) throw new Error("Failed to fetch sizes");
          const json = await res.json();
          set({ sizes: json.data ?? [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchColors: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/colors`);
          if (!res.ok) throw new Error("Failed to fetch colors");
          const json = await res.json();
          set({ colors: json.data ?? [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      createSize: async (data) => {
        const tempId = `temp-${Date.now()}`;
        const optimistic = { ...data, id: tempId } as Size;
        set((state) => ({ sizes: [...state.sizes, optimistic] }));

        try {
            const res = await fetch("/api/sizes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to create size");
            const json = await res.json();
            set((state) => ({
                sizes: state.sizes.map(s => s.id === tempId ? json : s)
            }));
        } catch (err: any) {
            set((state) => ({ sizes: state.sizes.filter(s => s.id !== tempId), error: err.message }));
        }
      },

      updateSize: async (id, data) => {
         const prev = get().sizes;
         const prevSize = prev.find(s => s.id === id);
         
         if (prevSize) {
            const updated = { ...prevSize, ...data } as Size;
            set({ sizes: prev.map(s => s.id === id ? updated : s) });
         }

         try {
            const res = await fetch(`/api/sizes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update size");
            const json = await res.json();
            set((state) => ({
                sizes: state.sizes.map(s => s.id === id ? json : s)
            }));
         } catch (err: any) {
            set({ sizes: prev, error: err.message });
         }
      },

      deleteSize: async (id) => {
         const prev = get().sizes;
         set({ sizes: prev.filter(s => s.id !== id) });

         try {
            const res = await fetch(`/api/sizes/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete size");
         } catch (err: any) {
            set({ sizes: prev, error: err.message });
         }
      },

      createColor: async (data) => {
        const tempId = `temp-${Date.now()}`;
        const optimistic = { ...data, id: tempId } as Color;
        set((state) => ({ colors: [...state.colors, optimistic] }));

        try {
            const res = await fetch("/api/colors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to create color");
            const json = await res.json();
            set((state) => ({
                colors: state.colors.map(c => c.id === tempId ? json : c)
            }));
        } catch (err: any) {
            set((state) => ({ colors: state.colors.filter(c => c.id !== tempId), error: err.message }));
        }
      },

      updateColor: async (id, data) => {
         const prev = get().colors;
         const prevColor = prev.find(c => c.id === id);
         
         if (prevColor) {
            const updated = { ...prevColor, ...data } as Color;
            set({ colors: prev.map(c => c.id === id ? updated : c) });
         }

         try {
            const res = await fetch(`/api/colors/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update color");
            const json = await res.json();
            set((state) => ({
                colors: state.colors.map(c => c.id === id ? json : c)
            }));
         } catch (err: any) {
            set({ colors: prev, error: err.message });
         }
      },

      deleteColor: async (id) => {
         const prev = get().colors;
         set({ colors: prev.filter(c => c.id !== id) });

         try {
            const res = await fetch(`/api/colors/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete color");
         } catch (err: any) {
            set({ colors: prev, error: err.message });
         }
      }
    }),
    { name: "attribute-store" }
  )
);
