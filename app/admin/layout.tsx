"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, Image, Plus } from "lucide-react";

const navItems = [
    { href: "/admin", label: "Orders", icon: LayoutDashboard },
    { href: "/admin/products/new", label: "New Product", icon: Plus },
    { href: "/admin/media", label: "Media", icon: Image },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)]">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 border-r bg-muted/40 md:block">
                <div className="flex h-full flex-col gap-2 p-4">
                    <h2 className="mb-4 px-2 text-lg font-semibold">Admin Dashboard</h2>
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    pathname === item.href
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
                <div className="flex h-16 items-center justify-around">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex h-11 w-11 flex-col items-center justify-center rounded-lg",
                                pathname === item.href
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="mt-1 text-[10px]">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
}
