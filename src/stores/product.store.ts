"use client";

import type { z } from "zod";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Category, ProductVariant } from "@/generated/prisma/client";
import type { productQuerySchema } from "@/lib/api/query-schemas";
import type {
  createProductSchema,
  createVariantSchema,
  updateProductSchema,
  updateVariantSchema,
} from "@/lib/validations/product";
import {
  buildSearchParams,
  coercePaginatedResponse,
  createRequestDeduper,
  fetchApi,
  fetchJson,
  unwrapApiPayload,
} from "@/stores/http";
import type {
  ApiProduct,
  PaginatedResponse,
  VariantSummary,
} from "@/types/api";

type Meta = PaginatedResponse<unknown>["meta"];
type ProductQueryParams = Partial<z.input<typeof productQuerySchema>>;
type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;
type CreateVariantInput = z.infer<typeof createVariantSchema>;
type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

type CategorySummary = Pick<Category, "id" | "name" | "slug">;
type ProductDetails = ApiProduct & {
  category: CategorySummary | null;
  variants: VariantSummary[];
};

interface ProductStoreState {
  products: ApiProduct[];
  product: ProductDetails | null;
  variants: VariantSummary[];
  meta: Meta;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProducts: (products: ApiProduct[]) => void;
  setProduct: (product: ProductDetails | null) => void;
  setVariants: (variants: VariantSummary[]) => void;
  setMeta: (meta: Meta) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // CRUD
  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  createProduct: (data: CreateProductInput) => Promise<void>;
  updateProduct: (id: string, data: UpdateProductInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Variant CRUD
  createVariant: (data: CreateVariantInput) => Promise<void>;
  updateVariant: (id: string, data: UpdateVariantInput) => Promise<void>;
  deleteVariant: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductStoreState>()(
  devtools(
    (set, get) => {
      const dedupe = createRequestDeduper();
      return {
        products: [],
        product: null,
        variants: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
        isLoading: false,
        error: null,

        setProducts: (products) => set({ products }),
        setProduct: (product) => set({ product }),
        setVariants: (variants) => set({ variants }),
        setMeta: (meta) => set({ meta }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        fetchProducts: async (params) => {
          console.log(
            `[ProductStore] fetchProducts() initiated. Current items:`,
            get().products.length,
            { params },
          );
          const query = buildSearchParams(
            (params ?? {}) as unknown as Parameters<
              typeof buildSearchParams
            >[0],
          ).toString();
          await dedupe(`GET:/api/products?${query}`, async () => {
            set({ isLoading: true, error: null });
            try {
              const json = await fetchJson<unknown>(
                query ? `/api/products?${query}` : "/api/products",
              );
              const payload = coercePaginatedResponse<ApiProduct>(json);
              console.log(
                `[ProductStore] fetchProducts() Success. Loaded items:`,
                payload.data.length,
              );
              set({
                products: payload.data,
                meta: payload.meta,
                isLoading: false,
                error: null,
              });
            } catch (err: unknown) {
              set({
                error: err instanceof Error ? err.message : "Request failed",
                isLoading: false,
              });
              console.error(
                `[ProductStore] fetchProducts() FAILED. Error:`,
                err,
              );
            }
          });
        },

        fetchProduct: async (id) => {
          console.log(`[ProductStore] fetchProduct() initiated`, { id });
          // Check cache (SWR)
          const cached = get().products.find((p) => p.id === id);
          if (cached)
            set({
              product: { ...cached, category: null, variants: [] },
            });
          set({ isLoading: true, error: null });

          try {
            await dedupe(`GET:/api/products/${id}`, async () => {
              const json = await fetchJson<unknown>(`/api/products/${id}`);
              const product = unwrapApiPayload(json) as ProductDetails;
              set({
                product,
                variants: product.variants ?? [],
                isLoading: false,
                error: null,
              });
            });
          } catch (err: unknown) {
            set({
              error: err instanceof Error ? err.message : "Request failed",
              isLoading: false,
            });
            console.error(`[ProductStore] fetchProduct() FAILED. Error:`, err);
          }
        },

        createProduct: async (data) => {
          console.log(
            `[ProductStore] createProduct() initiated. Current items:`,
            get().products.length,
            { data },
          );
          const tempId = crypto.randomUUID();
          const optimistic = { ...data, id: tempId } as ApiProduct;
          set((state) => ({
            products: [optimistic, ...state.products],
            error: null,
          }));

          try {
            const created = await fetchApi<ApiProduct>("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            console.log(
              `[ProductStore] createProduct() Success. New Item:`,
              created,
            );
            set((state) => ({
              products: state.products.map((p) =>
                p.id === tempId ? created : p,
              ),
              error: null,
            }));
          } catch (err: unknown) {
            set((state) => ({
              products: state.products.filter((p) => p.id !== tempId),
              error: err instanceof Error ? err.message : "Request failed",
            }));
            console.error(
              `[ProductStore] createProduct() FAILED. Reverted optimistic UI. Products count back to:`,
              get().products.length,
              `Error:`,
              err,
            );
          }
        },

        updateProduct: async (id, data) => {
          console.log(
            `[ProductStore] updateProduct() initiated on ID: ${id}. Current items:`,
            get().products.length,
            { data },
          );
          const prev = get().product;
          if (prev)
            set({
              product: { ...prev, ...data } as ProductDetails,
              error: null,
            });

          try {
            const updated = await fetchApi<ApiProduct>(`/api/products/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            console.log(
              `[ProductStore] updateProduct() Success. Updated Item:`,
              updated,
            );
            set((state) => ({
              product: state.product
                ? ({ ...state.product, ...updated } as ProductDetails)
                : ({
                    ...updated,
                    category: null,
                    variants: [],
                  } as ProductDetails),
              error: null,
            }));
          } catch (err: unknown) {
            if (prev) {
              set({
                product: prev,
                error: err instanceof Error ? err.message : "Request failed",
              });
              console.error(
                `[ProductStore] updateProduct() FAILED. Reverting optimistic update on ID: ${id}. Error:`,
                err,
              );
            }
          }
        },

        deleteProduct: async (id) => {
          console.log(
            `[ProductStore] deleteProduct() initiated on ID: ${id}. Items count before:`,
            get().products.length,
          );
          const prevProducts = get().products;
          set({
            products: prevProducts.filter((p) => p.id !== id),
            error: null,
          });

          try {
            await fetchJson<unknown>(`/api/products/${id}`, {
              method: "DELETE",
            });
            console.log(
              `[ProductStore] deleteProduct() Success for ID: ${id}. Items count now:`,
              get().products.length - 1,
            );
          } catch (err: unknown) {
            set({
              products: prevProducts,
              error: err instanceof Error ? err.message : "Request failed",
            });
            console.error(
              `[ProductStore] deleteProduct() FAILED. Reverted optimistic deletion for ID: ${id}. Products count back to:`,
              prevProducts.length,
              `Error:`,
              err,
            );
          }
        },

        createVariant: async (data) => {
          console.log(`[ProductStore] createVariant() initiated`, { data });
          const tempId = crypto.randomUUID();
          const optimistic = { ...data, id: tempId } as ProductVariant;
          set((state) => ({
            variants: [...state.variants, optimistic],
            error: null,
          }));

          try {
            const created = await fetchApi<ProductVariant>(
              "/api/product-variants",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              },
            );
            set((state) => ({
              variants: state.variants.map((v) =>
                v.id === tempId ? created : v,
              ),
              error: null,
            }));
          } catch (err: unknown) {
            set((state) => ({
              variants: state.variants.filter((v) => v.id !== tempId),
              error: err instanceof Error ? err.message : "Request failed",
            }));
            console.error(
              `[ProductStore] createVariant() FAILED. Reverted optimistic UI. Variants count back to:`,
              get().variants.length,
              `Error:`,
              err,
            );
          }
        },

        updateVariant: async (id, data) => {
          console.log(`[ProductStore] updateVariant() initiated`, { id, data });
          const prevVariants = get().variants;
          const prevVariant = prevVariants.find((v) => v.id === id);

          if (prevVariant) {
            const updated = { ...prevVariant, ...data } as ProductVariant;
            set({
              variants: prevVariants.map((v) => (v.id === id ? updated : v)),
              error: null,
            });
          }

          try {
            const updated = await fetchApi<ProductVariant>(
              `/api/product-variants/${id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              },
            );
            set((state) => ({
              variants: state.variants.map((v) => (v.id === id ? updated : v)),
              error: null,
            }));
          } catch (err: unknown) {
            set({
              variants: prevVariants,
              error: err instanceof Error ? err.message : "Request failed",
            });
            console.error(
              `[ProductStore] updateVariant() FAILED. Reverting optimistic update on ID: ${id}. Error:`,
              err,
            );
          }
        },

        deleteVariant: async (id) => {
          console.log(`[ProductStore] deleteVariant() initiated`, { id });
          const prevVariants = get().variants;
          set({
            variants: prevVariants.filter((v) => v.id !== id),
            error: null,
          });

          try {
            await fetchJson<unknown>(`/api/product-variants/${id}`, {
              method: "DELETE",
            });
          } catch (err: unknown) {
            set({
              variants: prevVariants,
              error: err instanceof Error ? err.message : "Request failed",
            });
            console.error(
              `[ProductStore] deleteVariant() FAILED. Reverted optimistic deletion for ID: ${id}. Variants count back to:`,
              prevVariants.length,
              `Error:`,
              err,
            );
          }
        },
      };
    },
    { name: "product-store", enabled: process.env.NODE_ENV === "development" },
  ),
);
