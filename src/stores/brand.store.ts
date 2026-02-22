import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Brand, BrandDocument, BrandPhilosophy, Founder, SocialLink } from "@/generated/prisma/client";
import { createGenericStore } from "./factory";

interface BrandStoreState {
  brands: Brand[];
  brand: Brand | null;
  documents: BrandDocument[];
  philosophy: BrandPhilosophy | null;
  founder: Founder | null;
  socialLinks: SocialLink[];
  
  // Actions
  setBrands: (brands: Brand[]) => void;
  setBrand: (brand: Brand | null) => void;
  
  // Custom logic
  fetchBrandDetails: (id: string) => Promise<void>;
  createBrand: (data: Partial<Brand>) => Promise<void>;
  updateBrand: (id: string, data: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
}

// Using the factory for simpler stores or parts of it
export const useBrandStore = create<BrandStoreState>()(
  devtools(
    (set, get) => ({
      brands: [],
      brand: null,
      documents: [],
      philosophy: null,
      founder: null,
      socialLinks: [],

      setBrands: (brands) => set({ brands }),
      setBrand: (brand) => set({ brand }),

      fetchBrandDetails: async (id) => {
        try {
          const res = await fetch(`/api/brands/${id}`);
          if (!res.ok) throw new Error("Failed to fetch brand");
          const json = await res.json();
          const data = json;
          
          set({
            brand: data,
            founder: data.founder,
            documents: data.documents,
            socialLinks: data.socialLinks,
            philosophy: data.philosophy
          });
        } catch (error) {
          console.error(error);
        }
      },

      createBrand: async (data) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticBrand = { ...data, id: tempId } as Brand;
        set((state) => ({ brands: [optimisticBrand, ...state.brands] }));

        try {
          const res = await fetch("/api/brands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed");
          const json = await res.json();
          const newBrand = json;
          set((state) => ({
             brands: state.brands.map((b) => (b.id === tempId ? newBrand : b)),
          }));
        } catch (e) {
          set((state) => ({ brands: state.brands.filter((b) => b.id !== tempId) }));
        }
      },

      updateBrand: async (id, data) => {
        const prevBrand = get().brand;
        if (prevBrand) {
           set({ brand: { ...prevBrand, ...data } as Brand });
        }

        try {
          const res = await fetch(`/api/brands/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed");
           const json = await res.json();
           set({ brand: json });
        } catch (e) {
           if (prevBrand) set({ brand: prevBrand });
        }
      },

      deleteBrand: async (id) => {
         const prevBrands = get().brands;
         set({ brands: prevBrands.filter(b => b.id !== id) });
         
         try {
            const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
         } catch (e) {
            set({ brands: prevBrands });
         }
      }
    }),
    { name: "brand-store" }
  )
);
