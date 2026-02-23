"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  /** Short descriptive label */
  title: string;
  /** Primary metric value (string so caller formats currency etc.) */
  value: string;
  /** Optional delta string e.g. "+12.3%" or "-5%" — sign determines color */
  delta?: string;
  /** Hugeicons icon object */
  icon: IconSvgElement;
  /** Show skeleton placeholder while store is loading */
  isLoading?: boolean;
}

/**
 * StatCard — KPI card displayed on the admin dashboard.
 *
 * Data flows: Store (fetched by page) → props → StatCard.
 * No fetch, no side-effects; pure presentational component.
 */
export function StatCard({
  title,
  value,
  delta,
  icon: Icon,
  isLoading = false,
}: StatCardProps) {
  const isPositiveDelta = delta ? !delta.startsWith("-") : null;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-28 animate-pulse" />
          <Skeleton className="size-9 animate-pulse rounded-full" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-7 w-24 animate-pulse" />
          <Skeleton className="h-4 w-16 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {/* Icon badge */}
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
          <HugeiconsIcon
            icon={Icon}
            className="size-4 text-primary"
            aria-hidden="true"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {/* Primary value */}
        <p className="text-2xl font-bold tracking-tight">{value}</p>

        {/* Delta badge */}
        {delta !== undefined && isPositiveDelta !== null && (
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-xs font-semibold",
              isPositiveDelta
                ? "border-success/30 bg-success/10 text-success"
                : "border-error/30 bg-error/10 text-error",
            )}
          >
            {isPositiveDelta ? (
              <HugeiconsIcon
                icon={ArrowUp01Icon}
                className="size-3"
                aria-hidden
              />
            ) : (
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="size-3"
                aria-hidden
              />
            )}
            {delta}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
