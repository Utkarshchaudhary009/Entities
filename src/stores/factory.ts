"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  buildSearchParams as buildSearchParamsFromParams,
  coercePaginatedResponse,
  createRequestDeduper,
  fetchApi,
  fetchJson,
  unwrapApiPayload,
} from "@/stores/http";
import type { PaginatedResponse } from "@/types/api";

export interface BaseEntity {
  id: string;
}

export type QueryParams = Parameters<typeof buildSearchParamsFromParams>[0];

export type Meta = PaginatedResponse<unknown>["meta"];

export interface GenericStoreState<T extends BaseEntity> {
  items: T[];
  selectedItem: T | null;
  meta: Meta;
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: T[]) => void;
  setMeta: (meta: Meta) => void;
  setSelectedItem: (item: T | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // CRUD
  fetchAll: (endpoint: string, params?: QueryParams) => Promise<void>;
  fetchOne: (endpoint: string, id: string) => Promise<T | undefined>;
  create: (
    endpoint: string,
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
  ) => Promise<T | undefined>;
  update: (
    endpoint: string,
    id: string,
    data: Partial<T>,
  ) => Promise<T | undefined>;
  delete: (endpoint: string, id: string) => Promise<boolean>;
}

export interface EntityStoreState<TItem extends BaseEntity, TCreate, TUpdate> {
  items: TItem[];
  selectedItem: TItem | null;
  meta: Meta;
  isLoading: boolean;
  error: string | null;

  setItems: (items: TItem[]) => void;
  setMeta: (meta: Meta) => void;
  setSelectedItem: (item: TItem | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  fetchAll: (params?: QueryParams) => Promise<void>;
  fetchOne: (id: string) => Promise<TItem | undefined>;
  create: (data: TCreate) => Promise<TItem | undefined>;
  update: (id: string, data: TUpdate) => Promise<TItem | undefined>;
  delete: (id: string) => Promise<boolean>;
}

export function createEntityStore<
  TItem extends BaseEntity,
  TCreate = Omit<TItem, "id" | "createdAt" | "updatedAt">,
  TUpdate = Partial<TItem>,
  TExtend extends Record<string, unknown> = Record<string, never>,
>(
  storeName: string,
  endpoint: string,
  extend?: (
    set: (
      partial:
        | Partial<EntityStoreState<TItem, TCreate, TUpdate> & TExtend>
        | ((
          state: EntityStoreState<TItem, TCreate, TUpdate> & TExtend,
        ) => Partial<EntityStoreState<TItem, TCreate, TUpdate> & TExtend>),
    ) => void,
    get: () => EntityStoreState<TItem, TCreate, TUpdate> & TExtend,
  ) => TExtend,
) {
  return create<EntityStoreState<TItem, TCreate, TUpdate> & TExtend>()(
    devtools(
      (set, get) => {
        const dedupe = createRequestDeduper();
        type Base = EntityStoreState<TItem, TCreate, TUpdate>;
        const setBase = set as unknown as (
          partial: Partial<Base> | ((state: Base & TExtend) => Partial<Base>),
        ) => void;

        const base = {
          items: [],
          selectedItem: null,
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
          isLoading: false,
          error: null,

          setItems: (items) => setBase({ items, error: null }),
          setMeta: (meta) => setBase({ meta }),
          setSelectedItem: (selectedItem) => setBase({ selectedItem }),
          setError: (error) => setBase({ error }),
          setLoading: (isLoading) => setBase({ isLoading }),

          fetchAll: async (params = {}) => {
            console.log(`[StoreFactory] ${storeName} fetchAll() initiated. Current Items:`, get().items.length, { endpoint, params });
            return dedupe(
              `GET:${endpoint}?${buildSearchParamsFromParams(params).toString()}`,
              async () => {
                setBase({ isLoading: true, error: null });
                try {
                  const query = buildSearchParamsFromParams(params).toString();
                  const json = await fetchJson<unknown>(
                    query ? `${endpoint}?${query}` : endpoint,
                  );
                  const payload = coercePaginatedResponse<TItem>(json);
                  console.log(`[StoreFactory] ${storeName} fetchAll() Success. Loaded Items:`, payload.data.length);
                  setBase({
                    items: payload.data,
                    meta: payload.meta,
                    isLoading: false,
                  });
                } catch (err: unknown) {
                  setBase({
                    error:
                      err instanceof Error ? err.message : "Request failed",
                    isLoading: false,
                  });
                  console.error(`[StoreFactory] ${storeName} fetchAll() FAILED. Error:`, err);
                }
              },
            );
          },

          fetchOne: async (id) => {
            console.log(`[StoreFactory] ${storeName} fetchOne() initiated`, { endpoint, id, currentlySelected: get().selectedItem?.id });
            setBase({ isLoading: true, error: null });
            const cached = get().items.find((i) => i.id === id);
            if (cached) {
              setBase({ selectedItem: cached, isLoading: false });
              return cached;
            }

            try {
              const item = await fetchApi<TItem>(`${endpoint}/${id}`);
              console.log(`[StoreFactory] ${storeName} fetchOne() Success. Loaded Item:`, item);
              setBase({ selectedItem: item, isLoading: false });
              return item;
            } catch (err: unknown) {
              setBase({
                error: err instanceof Error ? err.message : "Request failed",
                isLoading: false,
              });
              console.error(`[StoreFactory] ${storeName} fetchOne() FAILED. Error:`, err);
            }
          },

          create: async (data) => {
            console.log(`[StoreFactory] ${storeName} create() initiated`, { endpoint, data });
            const tempId = crypto.randomUUID();
            const optimisticItem = { ...(data as object), id: tempId } as TItem;
            const prevItems = get().items;

            setBase({ items: [optimisticItem, ...prevItems], error: null });

            try {
              const newItem = await fetchApi<TItem>(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });

              setBase((state) => ({
                items: state.items.map((i) => (i.id === tempId ? newItem : i)),
                error: null,
              }));

              return newItem;
            } catch (err: unknown) {
              setBase({
                items: prevItems,
                error: err instanceof Error ? err.message : "Request failed",
              });
              console.error(`[StoreFactory] ${storeName} create() FAILED. Reverting optimistic UI. Items count back to:`, prevItems.length, `Error:`, err);
            }
          },

          update: async (id, data) => {
            console.log(`[StoreFactory] ${storeName} update() initiated on ID: ${id}. Current Items count:`, get().items.length, { data });
            const prevItems = get().items;
            const prevItem = prevItems.find((i) => i.id === id);
            if (!prevItem) return;

            const optimisticPatch = data as unknown as Partial<TItem>;
            const optimisticItem = { ...prevItem, ...optimisticPatch };

            setBase({
              items: prevItems.map((i) => (i.id === id ? optimisticItem : i)),
              selectedItem:
                get().selectedItem?.id === id
                  ? optimisticItem
                  : get().selectedItem,
              error: null,
            });

            try {
              const updatedItem = await fetchApi<TItem>(`${endpoint}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });

              setBase((state) => ({
                items: state.items.map((i) => (i.id === id ? updatedItem : i)),
                selectedItem:
                  state.selectedItem?.id === id
                    ? updatedItem
                    : state.selectedItem,
                error: null,
              }));

              console.log(`[StoreFactory] ${storeName} update() Success. Updated Item:`, updatedItem);

              return updatedItem;
            } catch (err: unknown) {
              setBase({
                items: prevItems,
                selectedItem: prevItem,
                error: err instanceof Error ? err.message : "Request failed",
              });
              console.error(`[StoreFactory] ${storeName} update() FAILED. Reverting optimistic update on ID: ${id}. Error:`, err);
            }
          },

          delete: async (id) => {
            console.log(`[StoreFactory] ${storeName} delete() initiated on ID: ${id}. Items count before:`, get().items.length);
            const prevItems = get().items;
            const prevItem = prevItems.find((i) => i.id === id);
            const prevSelectedItem = get().selectedItem;

            setBase({
              items: prevItems.filter((i) => i.id !== id),
              selectedItem:
                get().selectedItem?.id === id ? null : get().selectedItem,
              error: null,
            });

            try {
              await fetchJson<unknown>(`${endpoint}/${id}`, {
                method: "DELETE",
              });
              console.log(`[StoreFactory] ${storeName} delete() Success for ID: ${id}. Items count now:`, get().items.length - 1);
              return true;
            } catch (err: unknown) {
              setBase({
                items: prevItems,
                selectedItem:
                  prevSelectedItem?.id === id
                    ? (prevItem ?? prevSelectedItem)
                    : prevSelectedItem,
                error: err instanceof Error ? err.message : "Request failed",
              });
              console.error(`[StoreFactory] ${storeName} delete() FAILED. Reverted optimistic deletion for ID: ${id}. Items count back to:`, prevItems.length, `Error:`, err);
              return false;
            }
          },
        } satisfies EntityStoreState<TItem, TCreate, TUpdate>;

        return {
          ...base,
          ...(extend ? extend(set, get) : ({} as TExtend)),
        };
      },
      { name: storeName, enabled: process.env.NODE_ENV === "development" },
    ),
  );
}

export const createGenericStore = <T extends BaseEntity>(storeName: string) =>
  create<GenericStoreState<T>>()(
    devtools(
      (set, get) => {
        const dedupe = createRequestDeduper();
        return {
          items: [],
          selectedItem: null,
          meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
          isLoading: false,
          error: null,

          setItems: (items) => set({ items, error: null }),
          setMeta: (meta) => set({ meta }),
          setSelectedItem: (selectedItem) => set({ selectedItem }),
          setError: (error) => set({ error }),
          setLoading: (isLoading) => set({ isLoading }),

          fetchAll: async (endpoint, params = {}) => {
            console.log(`[GenericStore] ${storeName} fetchAll() initiated. Current items:`, get().items.length, { endpoint, params });
            return dedupe(
              `GET:${endpoint}?${buildSearchParamsFromParams(params).toString()}`,
              async () => {
                set({ isLoading: true, error: null });
                try {
                  const query = buildSearchParamsFromParams(params).toString();
                  const json = await fetchJson<unknown>(
                    query ? `${endpoint}?${query}` : endpoint,
                  );
                  const payload = coercePaginatedResponse<T>(json);
                  console.log(`[GenericStore] ${storeName} fetchAll() Success. Loaded items:`, payload.data.length);
                  set({
                    items: payload.data,
                    meta: payload.meta,
                    isLoading: false,
                  });
                } catch (err: unknown) {
                  set({
                    error:
                      err instanceof Error ? err.message : "Request failed",
                    isLoading: false,
                  });
                  console.error(`[GenericStore] ${storeName} fetchAll() FAILED. Error:`, err);
                }
              },
            );
          },

          fetchOne: async (endpoint, id) => {
            console.log(`[GenericStore] ${storeName} fetchOne() initiated`, { endpoint, id });
            set({ isLoading: true, error: null });
            // Check cache first (SWR-ish)
            const cached = get().items.find((i) => i.id === id);
            if (cached) {
              set({ selectedItem: cached });
              return cached;
            }

            try {
              const json = await fetchJson<unknown>(`${endpoint}/${id}`);
              const item = unwrapApiPayload(json) as T;
              console.log(`[GenericStore] ${storeName} fetchOne() Success. Loaded:`, item);
              set({ selectedItem: item, isLoading: false });
              return item;
            } catch (err: unknown) {
              set({
                error: err instanceof Error ? err.message : "Request failed",
                isLoading: false,
              });
              console.error(`[GenericStore] ${storeName} fetchOne() FAILED. Error:`, err);
            }
          },

          create: async (endpoint, data) => {
            console.log(`[GenericStore] ${storeName} create() initiated`, { endpoint, data });
            // Optimistic UI
            const tempId = crypto.randomUUID();
            const optimisticItem = { ...data, id: tempId } as T;
            const prevItems = get().items;

            set({ items: [optimisticItem, ...prevItems], error: null });

            try {
              const newItem = await fetchApi<T>(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });

              // Replace temp item with real item
              set((state) => ({
                items: state.items.map((i) => (i.id === tempId ? newItem : i)),
                error: null,
              }));

              console.log(`[GenericStore] ${storeName} create() Success. New Item:`, newItem, `Items count now:`, get().items.length + 1);

              return newItem;
            } catch (err: unknown) {
              // Revert
              set({
                items: prevItems,
                error: err instanceof Error ? err.message : "Request failed",
              });
              console.error(`[GenericStore] ${storeName} create() FAILED. Reverting optimistic UI. Items count back to:`, prevItems.length, `Error:`, err);
            }
          },

          update: async (endpoint, id, data) => {
            console.log(`[GenericStore] ${storeName} update() initiated`, { endpoint, id, data });
            // Optimistic UI
            const prevItems = get().items;
            const prevItem = prevItems.find((i) => i.id === id);
            if (!prevItem) return;

            const optimisticItem = { ...prevItem, ...data };

            set({
              items: prevItems.map((i) => (i.id === id ? optimisticItem : i)),
              selectedItem:
                get().selectedItem?.id === id
                  ? optimisticItem
                  : get().selectedItem,
              error: null,
            });

            try {
              const updatedItem = await fetchApi<T>(`${endpoint}/${id}`, {
                method: "PUT", // or PATCH
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });

              set((state) => ({
                items: state.items.map((i) => (i.id === id ? updatedItem : i)),
                selectedItem:
                  state.selectedItem?.id === id
                    ? updatedItem
                    : state.selectedItem,
                error: null,
              }));

              console.log(`[GenericStore] ${storeName} update() Success. Updated Item:`, updatedItem);

              return updatedItem;
            } catch (err: unknown) {
              // Revert
              set({
                items: prevItems,
                selectedItem: prevItem,
                error: err instanceof Error ? err.message : "Request failed",
              });
              console.error(`[GenericStore] ${storeName} update() FAILED. Reverting optimistic update on ID: ${id}. Error:`, err);
            }
          },

          delete: async (endpoint, id) => {
            console.log(`[GenericStore] ${storeName} delete() initiated`, { endpoint, id });
            // Optimistic UI
            const prevItems = get().items;
            const prevItem = prevItems.find((i) => i.id === id); // Keep for revert
            const prevSelectedItem = get().selectedItem;

            set({
              items: prevItems.filter((i) => i.id !== id),
              selectedItem:
                get().selectedItem?.id === id ? null : get().selectedItem,
              error: null,
            });

            try {
              await fetchJson<unknown>(`${endpoint}/${id}`, {
                method: "DELETE",
              });
              console.log(`[GenericStore] ${storeName} delete() Success. Deleted ID: ${id}`);
              return true;
            } catch (err: unknown) {
              // Revert
              set({
                items: prevItems,
                selectedItem:
                  prevSelectedItem?.id === id
                    ? (prevItem ?? prevSelectedItem)
                    : prevSelectedItem,
                error: err instanceof Error ? err.message : "Request failed",
              });
              console.error(`[GenericStore] ${storeName} delete() FAILED. Reverted optimistic deletion for ID: ${id}. Items count back to:`, prevItems.length, `Error:`, err);
              return false;
            }
          },
        };
      },
      { name: storeName, enabled: process.env.NODE_ENV === "development" },
    ),
  );
