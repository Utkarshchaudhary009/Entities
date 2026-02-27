"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { fetchApi } from "@/stores/http";
import type { AdminDashboardOverview } from "@/types/api";

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
        console.log(`[AdminDashboardStore] fetchOverview() initiated.`);
        set({ isLoading: true, error: null });

        try {
          const overview = await fetchApi<AdminDashboardOverview>(
            "/api/admin/dashboard",
          );
          console.log(`[AdminDashboardStore] fetchOverview() Success. Loaded metrics.`);
          set({ overview, isLoading: false, error: null });
        } catch (err) {
          console.error(`[AdminDashboardStore] fetchOverview() FAILED. Error:`, err);
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
