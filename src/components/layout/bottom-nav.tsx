"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname } from "next/navigation";
import { useCartCount } from "@/stores/cart.store";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartCount();

  // Hide on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/80 px-2 pb-safe backdrop-blur-md md:hidden">
      {NAV_ITEMS.map((item) => {
        if (item.href === "/profile") {
          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              className="flex-1"
            >
              <div className="flex flex-col items-center gap-1 mt-1">
                <span className="relative">
                  <HugeiconsIcon icon={item.icon} className="size-5" />
                </span>
                <span className="text-[10px]">{item.label}</span>
              </div>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            className="flex-1"
          >
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="relative">
                <HugeiconsIcon icon={item.icon} className="size-5" />
                {item.href === "/cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </span>
              <span className="text-[10px]">{item.label}</span>
            </div>
          </NavLink>
        );
      })}
    </div>
  );
}
