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

/**
 * Topbar — site-wide sticky header.
 *
 * Behaviour:
 * - Hamburger (🍔) renders only when `enabled=true` (admin layout is active).
 * - "Admin" button renders only when the signed-in user has `user_role="admin"`.
 * - Reads sidebar state exclusively via `useSidebar()` store; no prop drilling.
 */
export function Topbar() {
  const { isOpen, enabled, toggle } = useSidebar();
  const { sessionClaims } = useAuth();
  const isAdmin =
    (sessionClaims as Record<string, unknown> | null)?.user_role === "admin";

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4 md:px-6">
        {/* ── Left: hamburger (admin-only) + logo ─────────────────────── */}
        <div className="flex items-center gap-3">
          {enabled && (
            <Button
              id="topbar-hamburger"
              variant="ghost"
              size="icon"
              aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
              onClick={toggle}
              className="transition-transform duration-150 active:scale-95"
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
            {/* Wordmark */}
            <span className="text-foreground">ENTITIES</span>
          </Link>
        </div>

        {/* ── Center: nav links (desktop) ───────────────────────────────── */}
        <nav
          className="hidden items-center gap-6 text-sm font-medium md:flex"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/shop"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Shop
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
        </nav>

        {/* ── Right: admin button + user avatar ────────────────────────── */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              id="topbar-admin-link"
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <Link href="/admin/dashboard">
                <HugeiconsIcon icon={Shield01Icon} className="size-4" />
                Admin
              </Link>
            </Button>
          )}

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
