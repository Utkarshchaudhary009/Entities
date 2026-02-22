import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Category } from "@/generated/prisma/client";

interface CategoryStoreState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchCategories: (params?: any) => Promise<void>;
  createCategory: (data: any) => Promise<void>;
  updateCategory: (id: string, data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStoreState>()(
  devtools(
    (set, get) => ({
      categories: [],
      isLoading: false,
      error: null,

      setCategories: (categories) => set({ categories }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchCategories: async (params) => {
        set({ isLoading: true });
        try {
          const query = new URLSearchParams(params).toString();
          const res = await fetch(`/api/categories?${query}`);
          if (!res.ok) throw new Error("Failed to fetch categories");
          const json = await res.json();
          set({ categories: json.data ?? [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      createCategory: async (data) => {
        const tempId = `temp-${Date.now()}`;
        const optimistic = { ...data, id: tempId } as Category;
        set((state) => ({ categories: [...state.categories, optimistic] }));

        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to create category");
            const json = await res.json();
            set((state) => ({
                categories: state.categories.map(c => c.id === tempId ? json : c)
            }));
        } catch (err: any) {
            set((state) => ({ categories: state.categories.filter(c => c.id !== tempId), error: err.message }));
        }
      },

      updateCategory: async (id, data) => {
         const prev = get().categories;
         const prevCategory = prev.find(c => c.id === id);
         
         if (prevCategory) {
            const updated = { ...prevCategory, ...data } as Category;
            set({ categories: prev.map(c => c.id === id ? updated : c) });
         }

         try {
            const res = await fetch(`/api/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update category");
            const json = await res.json();
            set((state) => ({
                categories: state.categories.map(c => c.id === id ? json : c)
            }));
         } catch (err: any) {
            set({ categories: prev, error: err.message });
         }
      },

      deleteCategory: async (id) => {
         const prev = get().categories;
         set({ categories: prev.filter(c => c.id !== id) });

         try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete category");
         } catch (err: any) {
            set({ categories: prev, error: err.message });
         }
      }
    }),
    { name: "category-store" }
  )
);
