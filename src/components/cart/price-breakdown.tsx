"use client";

import { cn } from "@/lib/utils";

function fmt(n: number) {
  return `₹${Math.floor(n).toLocaleString("en-IN")}`;
}

interface PriceBreakdownProps {
  subtotal: number;
  discountAmount: number;
  discountCode?: string | null;
  itemCount: number;
}

export function PriceBreakdown({
  subtotal,
  discountAmount,
  discountCode,
  itemCount,
}: PriceBreakdownProps) {
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 p-5 backdrop-blur-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Price Details
      </p>

      <div className="space-y-3">
        <Row
          label={`Subtotal (${itemCount} ${itemCount === 1 ? "item" : "items"})`}
          value={fmt(subtotal)}
        />

        {discountAmount > 0 && (
          <Row
            label={discountCode ? `Discount (${discountCode})` : "Discount"}
            value={`−${fmt(discountAmount)}`}
            valueClassName="text-emerald-500"
          />
        )}

        <Row label="Shipping" value="Free" valueClassName="text-emerald-500" />
      </div>

      <div className="my-4 border-t border-border/40" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <p className="text-base font-bold">Total</p>
        <p className="text-xl font-bold tracking-tight">{fmt(total)}</p>
      </div>

      {discountAmount > 0 && (
        <p className="mt-2 text-center text-xs font-medium text-emerald-500">
          🎉 You save {fmt(discountAmount)} on this order!
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", valueClassName)}>
        {value}
      </p>
    </div>
  );
}
