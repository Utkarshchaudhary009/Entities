"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AdminDashboardOverview } from "@/types/api";
import { fetchApi } from "@/stores/http";

interface AdminDashboardStoreState {
  overview: AdminDashboardOverview | null;
  isLoading: boolean;
  error: string | null;
  fetchOverview: () => Promise<void>;
}

export const useAdminDashboardStore = create<AdminDashboardStoreState>()(
  devtools(
    (set) => ({
      overview: null,
      isLoading: false,
      error: null,

      fetchOverview: async () => {
        set({ isLoading: true, error: null });

        try {
          const overview = await fetchApi<AdminDashboardOverview>(
            "/api/admin/dashboard",
          );
          set({ overview, isLoading: false, error: null });
        } catch {
          set({
            isLoading: false,
            error: "Unable to load admin dashboard overview.",
          });
        }
      },
    }),
    {
      name: "admin-dashboard-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
