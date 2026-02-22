import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Product, ProductVariant, Category } from "@/generated/prisma/client";

interface ProductStoreState {
  products: Product[];
  product: Product | null;
  variants: ProductVariant[];
  categories: Category[]; // Often needed with products
  isLoading: boolean;
  error: string | null;

  // Actions
  setProducts: (products: Product[]) => void;
  setProduct: (product: Product | null) => void;
  setVariants: (variants: ProductVariant[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // CRUD
  fetchProducts: (params?: any) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  createProduct: (data: any) => Promise<void>;
  updateProduct: (id: string, data: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Variant CRUD
  createVariant: (data: any) => Promise<void>;
  updateVariant: (id: string, data: any) => Promise<void>;
  deleteVariant: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductStoreState>()(
  devtools(
    (set, get) => ({
      products: [],
      product: null,
      variants: [],
      categories: [],
      isLoading: false,
      error: null,

      setProducts: (products) => set({ products }),
      setProduct: (product) => set({ product }),
      setVariants: (variants) => set({ variants }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchProducts: async (params) => {
        set({ isLoading: true });
        try {
          const query = new URLSearchParams(params).toString();
          const res = await fetch(`/api/products?${query}`);
          if (!res.ok) throw new Error("Failed to fetch products");
          const json = await res.json();
          set({ products: json.data ?? [], isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      fetchProduct: async (id) => {
         // Check cache (SWR)
         const cached = get().products.find(p => p.id === id);
         if (cached) set({ product: cached });
         else set({ isLoading: true });

         try {
            const res = await fetch(`/api/products/${id}`);
            if (!res.ok) throw new Error("Failed to fetch product");
            const json = await res.json();
            set({ product: json, variants: json.variants || [], isLoading: false });
         } catch (err: any) {
            set({ error: err.message, isLoading: false });
         }
      },

      createProduct: async (data) => {
        const tempId = `temp-${Date.now()}`;
        const optimistic = { ...data, id: tempId } as Product;
        set((state) => ({ products: [optimistic, ...state.products] }));

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to create product");
            const json = await res.json();
            set((state) => ({
                products: state.products.map(p => p.id === tempId ? json : p)
            }));
        } catch (err: any) {
            set((state) => ({ products: state.products.filter(p => p.id !== tempId), error: err.message }));
        }
      },

      updateProduct: async (id, data) => {
         const prev = get().product;
         if (prev) set({ product: { ...prev, ...data } as Product });

         try {
            const res = await fetch(`/api/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update product");
            const json = await res.json();
            set({ product: json });
         } catch (err: any) {
            if (prev) set({ product: prev, error: err.message });
         }
      },

      deleteProduct: async (id) => {
         const prevProducts = get().products;
         set({ products: prevProducts.filter(p => p.id !== id) });

         try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete product");
         } catch (err: any) {
            set({ products: prevProducts, error: err.message });
         }
      },

      createVariant: async (data) => {
         const tempId = `temp-${Date.now()}`;
         const optimistic = { ...data, id: tempId } as ProductVariant;
         set((state) => ({ variants: [...state.variants, optimistic] }));

         try {
            const res = await fetch("/api/product-variants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to create variant");
            const json = await res.json();
            set((state) => ({
                variants: state.variants.map(v => v.id === tempId ? json : v)
            }));
         } catch (err: any) {
            set((state) => ({ variants: state.variants.filter(v => v.id !== tempId), error: err.message }));
         }
      },

      updateVariant: async (id, data) => {
         const prevVariants = get().variants;
         const prevVariant = prevVariants.find(v => v.id === id);
         
         if (prevVariant) {
            const updated = { ...prevVariant, ...data } as ProductVariant;
            set({ variants: prevVariants.map(v => v.id === id ? updated : v) });
         }

         try {
            const res = await fetch(`/api/product-variants/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update variant");
            const json = await res.json();
            set((state) => ({
                variants: state.variants.map(v => v.id === id ? json : v)
            }));
         } catch (err: any) {
            set({ variants: prevVariants, error: err.message });
         }
      },

      deleteVariant: async (id) => {
         const prevVariants = get().variants;
         set({ variants: prevVariants.filter(v => v.id !== id) });

         try {
            const res = await fetch(`/api/product-variants/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete variant");
         } catch (err: any) {
            set({ variants: prevVariants, error: err.message });
         }
      }
    }),
    { name: "product-store" }
  )
);
