"use client";

import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useSidebarStore } from "@/stores/sidebar.store";

/**
 * AdminLayoutClient — activates the sidebar context (hamburger appears
 * in the Topbar) and lays out the admin sidebar next to page content.
 *
 * Kept separate from layout.tsx so the server component can guard with
 * Clerk auth() before any client code runs.
 */
export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const setEnabled = useSidebarStore((s) => s.setEnabled);

  useEffect(() => {
    setEnabled(true);
    return () => setEnabled(false);
  }, [setEnabled]);

  return (
    <div className="relative flex w-full">
      <AdminSidebar />
      {/* Content shifts right on desktop when sidebar is always visible */}
      <main className="flex-1 min-w-0 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
