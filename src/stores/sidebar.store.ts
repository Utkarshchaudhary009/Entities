"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface SidebarStoreState {
  /** Whether the sidebar slide-in panel is currently open */
  isOpen: boolean;
  /** Whether any page in the current route has activated the sidebar (admin layout) */
  enabled: boolean;

  // Actions
  toggle: () => void;
  open: () => void;
  close: () => void;
  setEnabled: (enabled: boolean) => void;
}

export const useSidebarStore = create<SidebarStoreState>()(
  devtools(
    (set) => ({
      isOpen: false,
      enabled: false,

      toggle: () =>
        set((state) => {
          console.log(`[SidebarStore] toggle() invoked. New state:`, !state.isOpen);
          return { isOpen: !state.isOpen };
        }, false, "sidebar/toggle"),
      open: () => {
        console.log(`[SidebarStore] open() invoked`);
        set({ isOpen: true }, false, "sidebar/open");
      },
      close: () => {
        console.log(`[SidebarStore] close() invoked`);
        set({ isOpen: false }, false, "sidebar/close");
      },
      setEnabled: (enabled) => {
        console.log(`[SidebarStore] setEnabled() invoked. Enabled:`, enabled);
        set({ enabled, isOpen: false }, false, "sidebar/setEnabled");
      },
    }),
    { name: "sidebar-store", enabled: process.env.NODE_ENV === "development" },
  ),
);
