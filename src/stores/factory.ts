import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface BaseEntity {
  id: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface GenericStoreState<T extends BaseEntity> {
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
  fetchAll: (endpoint: string, params?: Record<string, any>) => Promise<void>;
  fetchOne: (endpoint: string, id: string) => Promise<T | undefined>;
  create: (endpoint: string, data: Omit<T, "id" | "createdAt" | "updatedAt">) => Promise<T | undefined>;
  update: (endpoint: string, id: string, data: Partial<T>) => Promise<T | undefined>;
  delete: (endpoint: string, id: string) => Promise<boolean>;
}

export const createGenericStore = <T extends BaseEntity>(
  storeName: string
) =>
  create<GenericStoreState<T>>()(
    devtools(
      (set, get) => ({
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
          set({ isLoading: true, error: null });
          try {
            const query = new URLSearchParams(params as any).toString();
            const res = await fetch(`${endpoint}?${query}`);
            if (!res.ok) throw new Error("Failed to fetch data");
            const json = await res.json();
            
            // Handle standard API response format { success: true, data: { data: [], meta: {} } } or direct array
            const data = json.data?.data || json.data || [];
            const meta = json.data?.meta || { total: data.length, page: 1, limit: data.length, totalPages: 1 };
            
            set({ items: data, meta, isLoading: false });
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
          }
        },

        fetchOne: async (endpoint, id) => {
          // Check cache first (SWR-ish)
          const cached = get().items.find((i) => i.id === id);
          if (cached) {
            set({ selectedItem: cached });
            // Background revalidation could happen here
          } else {
            set({ isLoading: true });
          }

          try {
            const res = await fetch(`${endpoint}/${id}`);
            if (!res.ok) throw new Error("Failed to fetch item");
            const json = await res.json();
            const item = json.data || json;
            set({ selectedItem: item, isLoading: false });
            return item;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
          }
        },

        create: async (endpoint, data) => {
          // Optimistic UI
          const tempId = `temp-${Date.now()}`;
          const optimisticItem = { ...data, id: tempId } as T;
          const prevItems = get().items;
          
          set({ items: [optimisticItem, ...prevItems] });

          try {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to create item");
            
            const json = await res.json();
            const newItem = json.data || json;

            // Replace temp item with real item
            set((state) => ({
              items: state.items.map((i) => (i.id === tempId ? newItem : i)),
            }));
            
            return newItem;
          } catch (err: any) {
            // Revert
            set({ items: prevItems, error: err.message });
            console.error(`Failed to create item: ${err.message}`);
          }
        },

        update: async (endpoint, id, data) => {
          // Optimistic UI
          const prevItems = get().items;
          const prevItem = prevItems.find((i) => i.id === id);
          if (!prevItem) return;

          const optimisticItem = { ...prevItem, ...data };

          set({
            items: prevItems.map((i) => (i.id === id ? optimisticItem : i)),
            selectedItem: get().selectedItem?.id === id ? optimisticItem : get().selectedItem,
          });

          try {
            const res = await fetch(`${endpoint}/${id}`, {
              method: "PUT", // or PATCH
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to update item");
            
            const json = await res.json();
            const updatedItem = json.data || json;

            set((state) => ({
              items: state.items.map((i) => (i.id === id ? updatedItem : i)),
              selectedItem: state.selectedItem?.id === id ? updatedItem : state.selectedItem,
            }));

            return updatedItem;
          } catch (err: any) {
            // Revert
            set({ items: prevItems, selectedItem: prevItem, error: err.message });
            console.error(`Failed to update item: ${err.message}`);
          }
        },

        delete: async (endpoint, id) => {
          // Optimistic UI
          const prevItems = get().items;
          const prevItem = prevItems.find((i) => i.id === id); // Keep for revert

          set({
            items: prevItems.filter((i) => i.id !== id),
            selectedItem: get().selectedItem?.id === id ? null : get().selectedItem,
          });

          try {
            const res = await fetch(`${endpoint}/${id}`, {
              method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete item");
            
            return true;
          } catch (err: any) {
            // Revert
            set({ items: prevItems, error: err.message });
            if (get().selectedItem?.id === id && prevItem) {
               set({ selectedItem: prevItem });
            }
            console.error(`Failed to delete item: ${err.message}`);
            return false;
          }
        },
      }),
      { name: storeName }
    )
  );
