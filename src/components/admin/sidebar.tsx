"use client";

import {
  ArrowRight01Icon,
  Building06Icon,
  DashboardSquare01Icon,
  File02Icon,
  Package02Icon,
  PaintBrushIcon,
  PercentCircleIcon,
  RulerIcon,
  ShoppingCart01Icon,
  TagsIcon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: IconSvgElement }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: DashboardSquare01Icon },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart01Icon },
  { href: "/admin/products", label: "Products", icon: Package02Icon },
  { href: "/admin/categories", label: "Categories", icon: TagsIcon },
  { href: "/admin/discounts", label: "Discounts", icon: PercentCircleIcon },
  { href: "/admin/sizes", label: "Sizes", icon: RulerIcon },
  { href: "/admin/colors", label: "Colors", icon: PaintBrushIcon },
  { href: "/admin/brand", label: "Brand", icon: Building06Icon },
  { href: "/admin/founder", label: "Founder", icon: UserCircle02Icon },
  { href: "/admin/brand-documents", label: "Documents", icon: File02Icon },
];

/**
 * AdminSidebar — slide-in navigation panel.
 *
 * - Reads `isOpen` from `useSidebar()` store; no props needed.
 * - On mobile: overlaying slide-in (`fixed`, full height).
 * - On desktop (lg+): always visible, fixed-width (`w-64`).
 * - Active link highlighted via `usePathname()`.
 */
export function AdminSidebar() {
  const { isOpen, close } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      {/* Overlay (mobile only) — closes sidebar on backdrop click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={close}
        />
      )}

      {/* Panel */}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={cn(
          // Base styles
          "fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col",
          "border-r border-border bg-sidebar text-sidebar-foreground",
          "transition-transform duration-300 ease-in-out",
          // Mobile: slide in/out
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "lg:translate-x-0",
        )}
      >
        {/* Heading */}
        <div className="flex h-12 items-center border-b border-sidebar-border px-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Admin Panel
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Admin sections">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Button
                    variant="ghost"
                    asChild
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2 text-sm font-medium",
                      "transition-all duration-150 active:scale-95",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Link href={href} onClick={() => close()}>
                      <HugeiconsIcon icon={Icon} className="size-4 shrink-0" />
                      {label}
                      {isActive && (
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="ml-auto size-3.5 text-sidebar-primary"
                        />
                      )}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 text-center text-xs text-muted-foreground">
          Entities Admin v1
        </div>
      </aside>

      {/* Desktop spacer — pushes content right by sidebar width */}
      <div className="hidden w-64 shrink-0 lg:block" aria-hidden="true" />
    </>
  );
}
