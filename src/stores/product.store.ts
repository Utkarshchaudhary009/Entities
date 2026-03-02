"use client";

import type { z } from "zod";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Category } from "@/generated/prisma/client";
import type { productQuerySchema } from "@/lib/api/query-schemas";
import {
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
};

type ProductOverviewPayload = {
  product: ProductDetails;
  variants: Array<
    Omit<VariantSummary, "images"> & {
      previewImage: string | null;
    }
  >;
};

interface ProductStoreState {
  products: ApiProduct[];
  product: ProductDetails | null;
  variants: VariantSummary[];
  variantDetailsById: Record<string, VariantSummary>;
  meta: Meta;
  isLoading: boolean;
  error: string | null;

  setProducts: (products: ApiProduct[]) => void;
  setProduct: (product: ProductDetails | null) => void;
  setVariants: (variants: VariantSummary[]) => void;
  setMeta: (meta: Meta) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  fetchProductOverview: (id: string) => Promise<void>;
  fetchVariantDetails: (id: string) => Promise<VariantSummary | null>;
  createProduct: (data: CreateProductInput) => Promise<void>;
  updateProduct: (id: string, data: UpdateProductInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  createVariant: (data: CreateVariantInput) => Promise<void>;
  updateVariant: (id: string, data: UpdateVariantInput) => Promise<void>;
  deleteVariant: (id: string) => Promise<void>;
}

function toVariantSummary(
  variant: Omit<VariantSummary, "images"> & { previewImage: string | null },
): VariantSummary {
  return {
    id: variant.id,
    size: variant.size,
    color: variant.color,
    stock: variant.stock,
    sku: variant.sku,
    isActive: variant.isActive,
    images: variant.previewImage ? [variant.previewImage] : [],
  };
}

export const useProductStore = create<ProductStoreState>()(
  devtools(
    (set, get) => {
      const dedupe = createRequestDeduper();

      return {
        products: [],
        product: null,
        variants: [],
        variantDetailsById: {},
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
            }
          });
        },

        fetchProductOverview: async (id) => {
          set({ isLoading: true, error: null });

          try {
            await dedupe(`GET:/api/admin/products/${id}/overview`, async () => {
              const payload = await fetchApi<ProductOverviewPayload>(
                `/api/admin/products/${id}/overview`,
              );
              set({
                product: payload.product,
                variants: payload.variants.map(toVariantSummary),
                isLoading: false,
                error: null,
              });
            });
          } catch (err: unknown) {
            set({
              error: err instanceof Error ? err.message : "Request failed",
              isLoading: false,
            });
          }
        },

        fetchVariantDetails: async (id) => {
          const cached = get().variantDetailsById[id];
          if (cached) return cached;

          set({ isLoading: true, error: null });

          try {
            const details = await dedupe(
              `GET:/api/admin/product-variants/${id}/details`,
              async () => {
                const payload = await fetchApi<VariantSummary>(
                  `/api/admin/product-variants/${id}/details`,
                );

                set((state) => ({
                  variantDetailsById: {
                    ...state.variantDetailsById,
                    [id]: payload,
                  },
                }));

                return payload;
              },
            );

            set({ isLoading: false });
            return details;
          } catch (err: unknown) {
            set({
              error: err instanceof Error ? err.message : "Request failed",
              isLoading: false,
            });
            return null;
          }
        },

        createProduct: async (data) => {
          const validation = createProductSchema.safeParse(data);
          if (!validation.success) {
            const errorMessage = validation.error.issues
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ");
            set({ error: `Validation failed: ${errorMessage}` });
            return;
          }

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
          }
        },

        updateProduct: async (id, data) => {
          const validation = updateProductSchema.safeParse(data);
          if (!validation.success) {
            const errorMessage = validation.error.issues
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ");
            set({ error: `Validation failed: ${errorMessage}` });
            return;
          }

          const prev = get().product;
          const prevProducts = get().products;

          set((state) => ({
            product: state.product
              ? ({ ...state.product, ...data } as ProductDetails)
              : null,
            products: state.products.map((p) =>
              p.id === id ? { ...p, ...data } : p,
            ),
            error: null,
          }));

          try {
            const updated = await fetchApi<ApiProduct>(`/api/products/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            set((state) => ({
              product: state.product
                ? ({ ...state.product, ...updated } as ProductDetails)
                : ({ ...updated, category: null } as ProductDetails),
              products: state.products.map((p) => (p.id === id ? updated : p)),
              error: null,
            }));
          } catch (err: unknown) {
            set({
              product: prev,
              products: prevProducts,
              error: err instanceof Error ? err.message : "Request failed",
            });
          }
        },

        deleteProduct: async (id) => {
          const prevProducts = get().products;
          set({
            products: prevProducts.filter((p) => p.id !== id),
            error: null,
          });

          try {
            await fetchJson<unknown>(`/api/products/${id}`, {
              method: "DELETE",
            });
          } catch (err: unknown) {
            set({
              products: prevProducts,
              error: err instanceof Error ? err.message : "Request failed",
            });
          }
        },

        createVariant: async (data) => {
          const validation = createVariantSchema.safeParse(data);
          if (!validation.success) {
            const errorMessage = validation.error.issues
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ");
            set({ error: `Validation failed: ${errorMessage}` });
            return;
          }

          const tempId = crypto.randomUUID();
          const optimistic: VariantSummary = {
            id: tempId,
            size: data.size,
            color: data.color,
            images: data.images ?? [],
            stock: data.stock ?? 0,
            sku: data.sku ?? null,
            isActive: data.isActive ?? true,
          };
          set((state) => ({
            variants: [...state.variants, optimistic],
            error: null,
          }));

          try {
            const created = await fetchApi<VariantSummary>(
              "/api/product-variants",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              },
            );
            set((state) => ({
              variants: state.variants.map((variant) =>
                variant.id === tempId ? created : variant,
              ),
              variantDetailsById: {
                ...state.variantDetailsById,
                [created.id]: created,
              },
              error: null,
            }));
          } catch (err: unknown) {
            set((state) => ({
              variants: state.variants.filter(
                (variant) => variant.id !== tempId,
              ),
              error: err instanceof Error ? err.message : "Request failed",
            }));
          }
        },

        updateVariant: async (id, data) => {
          const validation = updateVariantSchema.safeParse(data);
          if (!validation.success) {
            const errorMessage = validation.error.issues
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ");
            set({ error: `Validation failed: ${errorMessage}` });
            return;
          }

          const prevVariants = get().variants;
          const prevDetails = get().variantDetailsById;

          set((state) => ({
            variants: state.variants.map((variant) =>
              variant.id === id ? { ...variant, ...data } : variant,
            ),
            variantDetailsById: state.variantDetailsById[id]
              ? {
                  ...state.variantDetailsById,
                  [id]: { ...state.variantDetailsById[id], ...data },
                }
              : state.variantDetailsById,
            error: null,
          }));

          try {
            const updated = await fetchApi<VariantSummary>(
              `/api/product-variants/${id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              },
            );
            set((state) => ({
              variants: state.variants.map((variant) =>
                variant.id === id ? updated : variant,
              ),
              variantDetailsById: {
                ...state.variantDetailsById,
                [id]: updated,
              },
              error: null,
            }));
          } catch (err: unknown) {
            set({
              variants: prevVariants,
              variantDetailsById: prevDetails,
              error: err instanceof Error ? err.message : "Request failed",
            });
          }
        },

        deleteVariant: async (id) => {
          const prevVariants = get().variants;
          const prevDetails = get().variantDetailsById;
          set((state) => {
            const nextDetails = { ...state.variantDetailsById };
            delete nextDetails[id];
            return {
              variants: state.variants.filter((variant) => variant.id !== id),
              variantDetailsById: nextDetails,
              error: null,
            };
          });

          try {
            await fetchJson<unknown>(`/api/product-variants/${id}`, {
              method: "DELETE",
            });
          } catch (err: unknown) {
            set({
              variants: prevVariants,
              variantDetailsById: prevDetails,
              error: err instanceof Error ? err.message : "Request failed",
            });
          }
        },
      };
    },
    { name: "product-store", enabled: process.env.NODE_ENV === "development" },
  ),
);
