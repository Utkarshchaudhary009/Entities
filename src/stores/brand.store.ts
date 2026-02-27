"use client";

import type { z } from "zod";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  BrandDocument,
  BrandPhilosophy,
  Founder,
  SocialLink,
} from "@/generated/prisma/client";
import type {
  createBrandSchema,
  updateBrandSchema,
} from "@/lib/validations/brand";
import { createRequestDeduper, fetchApi, fetchJson } from "@/stores/http";
import type { ApiBrand } from "@/types/api";

type CreateBrandInput = z.infer<typeof createBrandSchema>;
type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
type BrandDetails = ApiBrand & {
  founder: Founder;
  documents: BrandDocument[];
  socialLinks: SocialLink[];
  philosophy?: BrandPhilosophy | null;
};

interface BrandStoreState {
  brands: ApiBrand[];
  brand: ApiBrand | null;
  documents: BrandDocument[];
  philosophy: BrandPhilosophy | null;
  founder: Founder | null;
  socialLinks: SocialLink[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setBrands: (brands: ApiBrand[]) => void;
  setBrand: (brand: ApiBrand | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Custom logic
  fetchBrandDetails: (id: string) => Promise<void>;
  createBrand: (data: CreateBrandInput) => Promise<void>;
  updateBrand: (id: string, data: UpdateBrandInput) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
}

// Using the factory for simpler stores or parts of it
export const useBrandStore = create<BrandStoreState>()(
  devtools(
    (set, get) => {
      const dedupe = createRequestDeduper();
      return {
        brands: [],
        brand: null,
        documents: [],
        philosophy: null,
        founder: null,
        socialLinks: [],
        isLoading: false,
        error: null,

        setBrands: (brands) => set({ brands }),
        setBrand: (brand) => set({ brand }),
        setError: (error) => set({ error }),
        setLoading: (isLoading) => set({ isLoading }),

        fetchBrandDetails: async (id) => {
          console.log(`[BrandStore] fetchBrandDetails() initiated`, { id });
          set({ isLoading: true, error: null });
          try {
            await dedupe(`GET:/api/brands/${id}`, async () => {
              const data = await fetchApi<BrandDetails>(`/api/brands/${id}`);
              console.log(`[BrandStore] fetchBrandDetails() Success. Loaded:`, data.name);
              set({
                brand: data,
                founder: data.founder,
                documents: data.documents,
                socialLinks: data.socialLinks,
                philosophy: data.philosophy ?? null,
                isLoading: false,
                error: null,
              });
            });
          } catch (err: unknown) {
            set({
              error: err instanceof Error ? err.message : "Request failed",
              isLoading: false,
            });
            console.error(`[BrandStore] fetchBrandDetails() FAILED. Error:`, err);
          }
        },

        createBrand: async (data) => {
          console.log(`[BrandStore] createBrand() initiated. Current brands:`, get().brands.length, { data });
          const tempId = crypto.randomUUID();
          const optimisticBrand = { ...data, id: tempId } as ApiBrand;
          set((state) => ({
            brands: [optimisticBrand, ...state.brands],
            error: null,
          }));

          try {
            const newBrand = await fetchApi<ApiBrand>("/api/brands", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            console.log(`[BrandStore] createBrand() Success. New brand:`, newBrand, `Brands count now:`, get().brands.length + 1);
            set((state) => ({
              brands: state.brands.map((b) => (b.id === tempId ? newBrand : b)),
              error: null,
            }));
          } catch (err: unknown) {
            set((state) => ({
              brands: state.brands.filter((b) => b.id !== tempId),
              error: err instanceof Error ? err.message : "Request failed",
            }));
          }
        },

        updateBrand: async (id, data) => {
          console.log(`[BrandStore] updateBrand() initiated on ID: ${id}. Current brands:`, get().brands.length, { data });
          const prevBrand = get().brand;
          const prevBrands = get().brands;

          if (prevBrand) {
            set({
              brand: { ...prevBrand, ...data } as ApiBrand,
              brands: prevBrands.map((brand) =>
                brand.id === id ? ({ ...brand, ...data } as ApiBrand) : brand,
              ),
              error: null,
            });
          }

          try {
            const updated = await fetchApi<ApiBrand>(`/api/brands/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            console.log(`[BrandStore] updateBrand() Success. Updated brand:`, updated);
            set((state) => ({
              brand: updated,
              brands: state.brands.map((brand) =>
                brand.id === id ? updated : brand,
              ),
              error: null,
            }));
          } catch (err: unknown) {
            set({
              brand: prevBrand,
              brands: prevBrands,
              error: err instanceof Error ? err.message : "Request failed",
            });
          }
        },

        deleteBrand: async (id) => {
          console.log(`[BrandStore] deleteBrand() initiated on ID: ${id}. Brands count before:`, get().brands.length);
          const prevBrands = get().brands;
          set({ brands: prevBrands.filter((b) => b.id !== id), error: null });

          try {
            await fetchJson<unknown>(`/api/brands/${id}`, { method: "DELETE" });
            console.log(`[BrandStore] deleteBrand() Success for ID: ${id}. Brands count now:`, get().brands.length - 1);
          } catch (err: unknown) {
            set({
              brands: prevBrands,
              error: err instanceof Error ? err.message : "Request failed",
            });
            console.error(`[BrandStore] createBrand() FAILED. Reverted optimistic UI. Brands count back to:`, prevBrands.length, `Error:`, err);
          }
        },
      };
    },
    { name: "brand-store", enabled: process.env.NODE_ENV === "development" },
  ),
);
