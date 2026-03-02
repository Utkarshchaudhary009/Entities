"use client";

import Fuse from "fuse.js";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { fetchJson } from "@/stores/http";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnailUrl: string | null;
  categorySlug: string | null;
  categoryName: string | null;
}

interface ShopStoreState {
  catalog: CatalogProduct[];
  filteredCatalog: CatalogProduct[];
  searchQuery: string;
  isLoadingCatalog: boolean;
  isSearching: boolean;
  error: string | null;

  // Actions
  fetchCatalog: () => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export const useShopStore = create<ShopStoreState>()(
  devtools(
    (set, get) => {
      let fuseInstance: Fuse<CatalogProduct> | null = null;

      return {
        catalog: [],
        filteredCatalog: [],
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

            set({
              catalog,
              filteredCatalog: catalog,
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

        setSearchQuery: (query) => {
          set({ searchQuery: query });
          const { catalog } = get();

          if (!query.trim()) {
            set({ filteredCatalog: catalog });
            return;
          }

          if (fuseInstance) {
            const results = fuseInstance.search(query).map((res) => res.item);
            set({ filteredCatalog: results });
          }
        },
      };
    },
    { name: "shop-store", enabled: process.env.NODE_ENV === "development" },
  ),
);
