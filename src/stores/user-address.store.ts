"use client";

import { toast } from "sonner";
import { create } from "zustand";
import type { UserAddress } from "@/generated/prisma/client";
import { fetchApi } from "@/stores/http";

interface UserAddressState {
  addresses: UserAddress[];
  isLoading: boolean;
  isAdding: boolean;
  updatingId: string | null;
  deletingId: string | null;
  settingDefaultId: string | null;

  fetchAddresses: () => Promise<void>;
  addAddress: (
    data: Omit<UserAddress, "id" | "clerkId" | "createdAt" | "updatedAt">,
  ) => Promise<UserAddress | undefined>;
  updateAddress: (id: string, data: Partial<UserAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
}

export const useUserAddressStore = create<UserAddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
  isAdding: false,
  updatingId: null,
  deletingId: null,
  settingDefaultId: null,

  fetchAddresses: async () => {
    try {
      set({ isLoading: true });
      const addresses = await fetchApi<UserAddress[]>("/api/user/addresses");
      set({ addresses });
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      set({ isLoading: false });
    }
  },

  addAddress: async (data) => {
    const tempId = crypto.randomUUID();
    const optimistic: UserAddress = {
      ...data,
      id: tempId,
      clerkId: "optimistic",
      isDefault: data.isDefault ?? get().addresses.length === 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const prev = get().addresses;

    // Remove old default if new one is default
    let newAddresses = [optimistic, ...prev];
    if (optimistic.isDefault) {
      newAddresses = newAddresses.map((a) =>
        a.id === tempId ? a : { ...a, isDefault: false },
      );
    }

    set({ addresses: newAddresses, isAdding: true });

    try {
      const real = await fetchApi<UserAddress>("/api/user/addresses", {
        method: "POST",
        body: JSON.stringify(data),
      });
      set((s) => ({
        addresses: s.addresses.map((a) => (a.id === tempId ? real : a)),
        isAdding: false,
      }));
      return real;
    } catch {
      set({ addresses: prev, isAdding: false });
      toast.error("Failed to add address");
    }
  },

  updateAddress: async (id, data) => {
    const prev = get().addresses;

    // Optimistic
    let updatedAddresses = prev.map((a) =>
      a.id === id ? { ...a, ...data } : a,
    );
    if (data.isDefault) {
      updatedAddresses = updatedAddresses.map((a) =>
        a.id === id ? a : { ...a, isDefault: false },
      );
    }

    set({ addresses: updatedAddresses, updatingId: id });

    try {
      const updated = await fetchApi<UserAddress>(`/api/user/addresses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      set((s) => ({
        addresses: s.addresses.map((a) => (a.id === id ? updated : a)),
        updatingId: null,
      }));
    } catch {
      set({ addresses: prev, updatingId: null });
      toast.error("Failed to update address");
    }
  },

  deleteAddress: async (id) => {
    const prev = get().addresses;
    set({ addresses: prev.filter((a) => a.id !== id), deletingId: id });

    try {
      await fetchApi(`/api/user/addresses/${id}`, {
        method: "DELETE",
      });
      // Refresh to get potentially new default
      await get().fetchAddresses();
      set({ deletingId: null });
    } catch {
      set({ addresses: prev, deletingId: null });
      toast.error("Failed to delete address");
    }
  },

  setDefault: async (id) => {
    const prev = get().addresses;
    set({
      addresses: prev.map((a) => ({ ...a, isDefault: a.id === id })),
      settingDefaultId: id,
    });

    try {
      await fetchApi(`/api/user/addresses/${id}/default`, {
        method: "PATCH",
      });
      set({ settingDefaultId: null });
    } catch {
      set({ addresses: prev, settingDefaultId: null });
      toast.error("Failed to set default address");
    }
  },
}));
