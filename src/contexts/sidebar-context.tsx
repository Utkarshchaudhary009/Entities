"use client";

import { useEffect } from "react";
import { useSidebarStore } from "@/stores/sidebar.store";

/**
 * SidebarProvider — mount in any layout that needs the sidebar active.
 * Sets `enabled=true` on mount so the topbar hamburger appears,
 * and reverts to `enabled=false` on unmount (leaving admin layouts).
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const setEnabled = useSidebarStore((s) => s.setEnabled);

  useEffect(() => {
    setEnabled(true);
    return () => setEnabled(false);
  }, [setEnabled]);

  return <>{children}</>;
}

/**
 * Ergonomic hook — components call useSidebar() instead of
 * importing the store directly, keeping the coupling shallow.
 */
export const useSidebar = useSidebarStore;
