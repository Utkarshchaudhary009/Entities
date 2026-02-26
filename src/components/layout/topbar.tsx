"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import {
  Cancel01Icon,
  Menu01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { useCartCount } from "@/stores/cart.store";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function Topbar() {
  const { isOpen, enabled, toggle } = useSidebar();
  const { sessionClaims } = useAuth();
  const isAdmin = sessionClaims?.metadata.role === "admin";
  const cartCount = useCartCount();

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {enabled && (
            <Button
              id="topbar-hamburger"
              variant="ghost"
              size="icon"
              aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
              onClick={toggle}
              className="transition-transform duration-150 active:scale-95 md:hidden"
            >
              {isOpen ? (
                <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
              ) : (
                <HugeiconsIcon icon={Menu01Icon} className="size-5" />
              )}
            </Button>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="text-foreground">ENTITIES</span>
          </Link>
        </div>

        <nav
          className="hidden items-center gap-8 text-sm font-medium md:flex"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            if (item.href === "/profile") return null; // We use UserAvatar for profile in topbar
            return (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                className="flex-row gap-2"
              >
                <span className="relative">
                  <HugeiconsIcon icon={item.icon} className="size-5" />
                  {item.href === "/cart" && cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              id="topbar-admin-link"
              variant="outline"
              size="sm"
              asChild
              className="hidden md:flex gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <Link href="/admin/dashboard">
                <HugeiconsIcon icon={Shield01Icon} className="size-4" />
                Admin
              </Link>
            </Button>
          )}

          <div className="hidden md:block">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
