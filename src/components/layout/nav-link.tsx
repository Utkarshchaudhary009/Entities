"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  label: string;
  // biome-ignore lint/suspicious/noExplicitAny: HugeiconsIcon type is complex
  icon?: any; // HugeiconsIcon type
  isActive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function NavLink({
  href,
  label,
  icon,
  className,
  children,
}: NavLinkProps) {
  const pathname = usePathname();
  // exact match or prefix for active state, profile routes should match /profile*
  const isActive =
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-colors relative",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      aria-label={label}
    >
      {icon && <HugeiconsIcon icon={icon} className="size-5" />}
      {children}
      {isActive && (
        <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-foreground md:-bottom-4" />
      )}
    </Link>
  );
}
