"use client";

import {
  DiscountTag01Icon,
  Invoice02Icon,
  PackageIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect } from "react";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useAdminDashboardStore } from "@/stores/admin-dashboard.store";

export default function AdminDashboardPage() {
  const { overview, isLoading, error, fetchOverview } =
    useAdminDashboardStore();

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  return (
    <section className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Store-powered KPI summary across orders, inventory, and discounts.
        </p>
      </header>

      {error && (
        <Card className="border-error/30 bg-error/5">
          <CardContent className="pt-6 text-sm text-error">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={String(overview?.totalOrders ?? 0)}
          icon={Invoice02Icon}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(overview?.totalRevenue ?? 0)}
          icon={Wallet01Icon}
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Orders"
          value={String(overview?.pendingOrders ?? 0)}
          icon={PackageIcon}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Discounts"
          value={String(overview?.activeDiscounts ?? 0)}
          icon={DiscountTag01Icon}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: loading rows are static placeholders
                  <div key={idx} className="grid grid-cols-4 gap-3">
                    <Skeleton className="h-4 w-full animate-pulse" />
                    <Skeleton className="h-4 w-full animate-pulse" />
                    <Skeleton className="h-4 w-full animate-pulse" />
                    <Skeleton className="h-4 w-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : overview && overview.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {overview.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-1 gap-2 rounded-md border p-3 text-sm md:grid-cols-4 md:items-center"
                  >
                    <span className="font-medium">#{order.orderNumber}</span>
                    <span className="text-muted-foreground">
                      {order.customerName}
                    </span>
                    <span>{formatCurrency(order.total)}</span>
                    <span className="md:text-right">
                      <Badge variant="secondary">{order.status}</Badge>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent orders found.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: loading rows are static placeholders
                <Skeleton key={idx} className="h-8 w-full animate-pulse" />
              ))
            ) : overview && overview.statusBreakdown.length > 0 ? (
              overview.statusBreakdown.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{item.status}</span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No status data available.
              </p>
            )}

            <div className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
              <span className="font-medium">Low-stock variants:</span>{" "}
              {overview?.lowStockVariants ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
