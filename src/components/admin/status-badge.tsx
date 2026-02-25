import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  PROCESSING: {
    label: "Processing",
    className:
      "border-secondary-foreground/30 bg-secondary text-secondary-foreground",
  },
  SHIPPED: {
    label: "Shipped",
    className: "border-border bg-muted text-foreground",
  },
  DELIVERED: {
    label: "Delivered",
    className: "border-success/40 bg-success/10 text-success",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

export interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

/**
 * StatusBadge — maps an OrderStatus enum value to a semantically
 * colored shadcn Badge. Pure presentational; no store interaction.
 *
 * Usage: <StatusBadge status={order.status} />
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-semibold tracking-wide",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
