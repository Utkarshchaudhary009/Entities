"use client";

import { useSidebarStore } from "@/stores/sidebar.store";

/**
 * Ergonomic hook — components call useSidebar() instead of
 * importing the store directly, keeping the coupling shallow.
 *
 * Note: Sidebar activation is handled by AdminLayoutClient, not here.
 * This avoids duplicate setEnabled calls.
 */
export const useSidebar = useSidebarStore;
