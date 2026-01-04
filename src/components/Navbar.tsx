"use client";

import Link from "next/link";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { ShoppingBag, Menu, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
    const { user, isLoaded } = useUser();

    const isAdmin =
        isLoaded && user?.publicMetadata?.role === "admin";

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold text-xl tracking-tight">ENTITIES</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/"
                            className="text-sm font-medium transition-colors hover:text-primary"
                        >
                            Home
                        </Link>
                        <Link
                            href="/store"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Store
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <Link href="/admin">
                            <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                    )}

                    {/* Wishlist/Cart Icon Placeholder - functionality to be added */}
                    <Button variant="ghost" size="icon" className="relative">
                        <ShoppingBag className="h-5 w-5" />
                        <span className="sr-only">Shopping Cart</span>
                    </Button>

                    <div className="hidden md:flex">
                        {!isLoaded ? (
                            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                        ) : user ? (
                            <UserButton afterSignOutUrl="/" />
                        ) : (
                            <SignInButton mode="modal">
                                <Button size="sm">Sign In</Button>
                            </SignInButton>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-4 mt-8">
                                <Link href="/" className="text-lg font-medium">
                                    Home
                                </Link>
                                <Link href="/store" className="text-lg font-medium">
                                    Store
                                </Link>
                                {isAdmin && (
                                    <Link href="/admin" className="text-lg font-medium text-primary">
                                        Admin Dashboard
                                    </Link>
                                )}
                                <div className="mt-4">
                                    {!isLoaded ? null : user ? (
                                        <div className="flex items-center gap-2">
                                            <UserButton afterSignOutUrl="/" />
                                            <span className="text-sm font-medium">{user.fullName}</span>
                                        </div>
                                    ) : (
                                        <SignInButton mode="modal">
                                            <Button className="w-full">Sign In</Button>
                                        </SignInButton>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
