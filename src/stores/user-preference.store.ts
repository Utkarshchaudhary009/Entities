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
      console.log(`[UserPreferenceStore] fetchPreferences() initiated.`);
      try {
        set({ isLoading: true });
        const preferences = await fetchApi<UserPreference>(
          "/api/user/preferences",
        );
        console.log(
          `[UserPreferenceStore] fetchPreferences() Success. Loaded:`,
          preferences,
        );
        set({ preferences });
      } catch (err) {
        console.error(
          `[UserPreferenceStore] fetchPreferences() FAILED. Error:`,
          err,
        );
        toast.error("Failed to load preferences");
      } finally {
        set({ isLoading: false });
      }
    },

    updatePreference: async (field, value) => {
      console.log(
        `[UserPreferenceStore] updatePreference() initiated. Field: ${String(field)}, Value:`,
        value,
      );
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
        console.log(
          `[UserPreferenceStore] updatePreference() Success. Updated Field: ${String(field)}`,
        );
        set({ savingField: null });
      } catch (err) {
        set({ preferences: prev, savingField: null });
        console.error(
          `[UserPreferenceStore] updatePreference() FAILED. Reverting optimistic update on field ${String(field)}. Error:`,
          err,
        );
        toast.error("Failed to update preference");
      }
    },
  }),
);
