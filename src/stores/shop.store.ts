"use client";

import Fuse from "fuse.js";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createRequestDeduper, fetchApi, fetchJson } from "@/stores/http";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnailUrl: string | null;
  categorySlug: string | null;
  categoryName: string | null;
}

type ProductCategorySummary = {
  id: string;
  slug: string;
  name: string;
};

export type ProductVariantOption = {
  id: string;
  size: string;
  color: string;
  stock: number;
  previewImage: string | null;
};

export type ProductDetails = {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnailUrl: string | null;
  defaultColor: string | null;
  defaultSize: string | null;
  category: ProductCategorySummary | null;
  variants: ProductVariantOption[];
};

interface ShopStoreState {
  catalog: CatalogProduct[];
  filteredCatalog: CatalogProduct[];
  productDetailsById: Record<string, ProductDetails>;
  loadingProductIds: Record<string, boolean>;
  variantMediaByProductId: Record<string, Record<string, string[]>>;
  loadingVariantMediaByKey: Record<string, boolean>;
  searchQuery: string;
  isLoadingCatalog: boolean;
  isSearching: boolean;
  error: string | null;

  // Actions
  fetchCatalog: () => Promise<void>;
  fetchProductDetails: (productId: string) => Promise<void>;
  fetchVariantMedia: (productId: string, color: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export const useShopStore = create<ShopStoreState>()(
  devtools(
    (set, get) => {
      let fuseInstance: Fuse<CatalogProduct> | null = null;
      const dedupe = createRequestDeduper();

      return {
        catalog: [],
        filteredCatalog: [],
        productDetailsById: {},
        loadingProductIds: {},
        variantMediaByProductId: {},
        loadingVariantMediaByKey: {},
        searchQuery: "",
        isLoadingCatalog: false,
        isSearching: false,
        error: null,

        fetchCatalog: async () => {
          if (get().catalog.length > 0) return; // Already fetched
          set({ isLoadingCatalog: true, error: null });

          try {
            const catalog =
              await fetchJson<CatalogProduct[]>("/api/shop/catalog");

            fuseInstance = new Fuse(catalog, {
              keys: ["name", "categoryName"],
              threshold: 0.3,
            });

            const currentSearchQuery = get().searchQuery.trim();

            const filteredCatalog =
              currentSearchQuery && fuseInstance
                ? fuseInstance
                    .search(currentSearchQuery)
                    .map((result) => result.item)
                : catalog;

            set({
              catalog,
              filteredCatalog,
              isLoadingCatalog: false,
            });
          } catch (err: unknown) {
            set({
              error:
                err instanceof Error ? err.message : "Failed to load catalog",
              isLoadingCatalog: false,
            });
          }
        },

        fetchProductDetails: async (productId) => {
          if (get().productDetailsById[productId]) {
            set({ error: null });
            return;
          }

          set((state) => ({
            loadingProductIds: {
              ...state.loadingProductIds,
              [productId]: true,
            },
            error: null,
          }));

          try {
            await dedupe(`GET:/api/shop/products/${productId}`, async () => {
              const details = await fetchApi<ProductDetails>(
                `/api/shop/products/${productId}`,
              );
              set((state) => ({
                productDetailsById: {
                  ...state.productDetailsById,
                  [productId]: details,
                },
              }));
            });
          } catch (err: unknown) {
            set({
              error:
                err instanceof Error
                  ? err.message
                  : "Failed to load product details",
            });
          } finally {
            set((state) => ({
              loadingProductIds: {
                ...state.loadingProductIds,
                [productId]: false,
              },
            }));
          }
        },

        fetchVariantMedia: async (productId, color) => {
          const normalizedColor = color.trim();
          if (!normalizedColor) return;
          if (get().variantMediaByProductId[productId]?.[normalizedColor])
            return;

          const key = `${productId}:${normalizedColor}`;
          set((state) => ({
            loadingVariantMediaByKey: {
              ...state.loadingVariantMediaByKey,
              [key]: true,
            },
            error: null,
          }));

          try {
            await dedupe(`GET:/api/shop/products/${key}:media`, async () => {
              const images = await fetchJson<string[]>(
                `/api/shop/products/${productId}/variant-media?color=${encodeURIComponent(
                  normalizedColor,
                )}`,
              );

              set((state) => ({
                variantMediaByProductId: {
                  ...state.variantMediaByProductId,
                  [productId]: {
                    ...(state.variantMediaByProductId[productId] ?? {}),
                    [normalizedColor]: images,
                  },
                },
              }));
            });
          } catch (err: unknown) {
            set({
              error:
                err instanceof Error
                  ? err.message
                  : "Failed to load variant media",
            });
          } finally {
            set((state) => ({
              loadingVariantMediaByKey: {
                ...state.loadingVariantMediaByKey,
                [key]: false,
              },
            }));
          }
        },

        setSearchQuery: (query) => {
          set({ searchQuery: query, isSearching: true });
          const { catalog } = get();

          if (!query.trim()) {
            set({ filteredCatalog: catalog, isSearching: false });
            return;
          }

          if (fuseInstance) {
            const results = fuseInstance.search(query).map((res) => res.item);
            set({ filteredCatalog: results, isSearching: false });
          } else {
            set({ isSearching: false });
          }
        },
      };
    },
    { name: "shop-store", enabled: process.env.NODE_ENV === "development" },
  ),
);
