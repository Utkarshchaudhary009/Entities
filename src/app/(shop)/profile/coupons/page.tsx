"use client";

import {
  ArrowLeft01Icon,
  Copy01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiscountStore } from "@/stores/discount.store";

export default function CouponsPage() {
  const { items: discounts, isLoading, fetchAll } = useDiscountStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied!");
  };

  const activeDiscounts = discounts.filter((d) => d.isActive);

  return (
    <div className="flex flex-col h-full bg-card min-h-[500px]">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" asChild className="-ml-2 mr-2">
          <Link href="/profile">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">My Coupons</h2>
      </div>

      <div className="p-4 space-y-4">
        {isLoading && activeDiscounts.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : activeDiscounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <HugeiconsIcon
              icon={Ticket01Icon}
              className="size-12 mx-auto mb-4 opacity-50"
            />
            <p>No active coupons.</p>
          </div>
        ) : (
          activeDiscounts.map((discount) => (
            <div
              key={discount.id}
              className="flex border rounded-xl overflow-hidden mb-4"
            >
              <div className="bg-primary/5 p-4 flex flex-col justify-center border-r border-dashed border-primary/20 min-w-[120px]">
                <span className="font-bold text-lg text-primary text-center">
                  {discount.discountType === "PERCENTAGE"
                    ? `${discount.value}% OFF`
                    : `₹${discount.value} OFF`}
                </span>
              </div>
              <div className="p-4 flex-1 flex justify-between items-center bg-card">
                <div>
                  <p className="font-semibold">{discount.code}</p>
                  {discount.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {discount.description}
                    </p>
                  )}
                  {discount.minOrderValue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Min. order ₹{discount.minOrderValue}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(discount.code)}
                >
                  <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
