"use client";

import { PackageIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderStore } from "@/stores/order.store";

export default function OrdersPage() {
  const { items: orders, isLoading, fetchAll } = useOrderStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="flex flex-col h-full bg-card min-h-[500px]">
      <div className="flex items-center p-4 border-b">
        <BackButton fallbackHref="/profile" />
        <h2 className="text-lg font-semibold">My Orders</h2>
      </div>

      <div className="p-4 space-y-4">
        {isLoading && orders.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <HugeiconsIcon
              icon={PackageIcon}
              className="size-12 mx-auto mb-4 opacity-50"
            />
            <p>No orders yet.</p>
            <p className="text-sm">Start shopping to see your orders here.</p>
            <Button asChild className="mt-4">
              <Link href="/shop">Browse Shop</Link>
            </Button>
          </div>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/profile/orders/${order.id}`}>
              <div className="p-4 border rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      #{order.orderNumber}
                    </span>
                    <Badge
                      variant={
                        order.status === "DELIVERED" ? "default" : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium mt-2">
                    ₹{order.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
