"use client";

import { toast } from "sonner";
import { create } from "zustand";
import type { UserPreference } from "@/generated/prisma/client";
import { fetchApi } from "@/stores/http";

interface UserPreferenceState {
  preferences: UserPreference | null;
  isLoading: boolean;
  savingField: keyof UserPreference | null;

  fetchPreferences: () => Promise<void>;
  updatePreference: <K extends keyof UserPreference>(
    field: K,
    value: UserPreference[K],
  ) => Promise<void>;
}

export const useUserPreferenceStore = create<UserPreferenceState>(
  (set, get) => ({
    preferences: null,
    isLoading: false,
    savingField: null,

    fetchPreferences: async () => {
      try {
        set({ isLoading: true });
        const preferences = await fetchApi<UserPreference>(
          "/api/user/preferences",
        );
        set({ preferences });
      } catch {
        toast.error("Failed to load preferences");
      } finally {
        set({ isLoading: false });
      }
    },

    updatePreference: async (field, value) => {
      const prev = get().preferences;
      if (!prev) return;

      // Optimistic
      set({
        preferences: { ...prev, [field]: value },
        savingField: field,
      });

      try {
        await fetchApi("/api/user/preferences", {
          method: "PATCH",
          body: JSON.stringify({ [field]: value }),
        });
        set({ savingField: null });
      } catch {
        set({ preferences: prev, savingField: null });
        toast.error("Failed to update preference");
      }
    },
  }),
);
