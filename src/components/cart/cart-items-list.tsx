"use client";

import {
  Cancel01Icon,
  MinusSignIcon,
  MoreHorizontalIcon,
  PlusSignIcon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { BlurImage } from "@/components/ui/blur-image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCartIsLoading,
  useCartItems,
  useCartStore,
} from "@/stores/cart.store";

function fmt(n: number) {
  return `₹${Math.floor(n).toLocaleString("en-IN")}`;
}

export function CartItemsList() {
  const items = useCartItems();
  const isLoading = useCartIsLoading();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/60 p-4"
          >
            <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-dashed border-border/60 bg-card/30 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
          <HugeiconsIcon
            icon={ShoppingCart01Icon}
            className="h-8 w-8 text-muted-foreground"
          />
        </div>
        <div>
          <p className="text-lg font-semibold">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse our products and add something you love.
          </p>
        </div>
        <Link
          href="/shop"
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform active:scale-95"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative flex items-start gap-4 rounded-2xl border border-border/40 bg-card/70 p-4 backdrop-blur-sm transition-all duration-200 hover:border-border/70 hover:bg-card/90"
        >
          {/* Thumbnail */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted/40">
            {item.productImage ? (
              <BlurImage
                src={item.productImage}
                alt={item.productName}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground">
                No image
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-semibold leading-tight">
              {item.productName}
            </p>

            {/* Size / Color pills */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-border/60 bg-background/50 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
                Size: {item.size}
              </span>
              <span className="rounded-full border border-border/60 bg-background/50 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80">
                Color: {item.color}
              </span>
            </div>

            {/* Price + Qty */}
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p className="text-base font-bold">{fmt(item.subtotal)}</p>

              {/* Quantity stepper */}
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-1 py-1">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.productVariantId, item.quantity - 1)
                  }
                  disabled={isLoading}
                  className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-muted active:scale-90 disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <HugeiconsIcon icon={MinusSignIcon} className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm font-semibold tabular-nums">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.productVariantId, item.quantity + 1)
                  }
                  disabled={isLoading || item.quantity >= item.stock}
                  className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-muted active:scale-90 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="h-3 w-3" />
                </button>
              </div>
            </div>

            {item.stock <= 3 && (
              <p className="mt-1 text-[11px] font-medium text-amber-500">
                Only {item.stock} left in stock
              </p>
            )}
          </div>

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => removeItem(item.productVariantId)}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
