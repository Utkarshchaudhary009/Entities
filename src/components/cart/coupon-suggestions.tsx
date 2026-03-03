"use client";

import { ArrowRight01Icon, Ticket01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ApiDiscount } from "@/types/api";

interface CouponSuggestionsProps {
  subtotal: number;
  appliedCode: string | null;
  onApply: (code: string) => void;
}

function fmt(n: number) {
  return `₹${Math.floor(n).toLocaleString("en-IN")}`;
}

function describeDiscount(d: ApiDiscount): string {
  if (d.discountType === "PERCENTAGE") {
    const cap = d.maxDiscount ? ` (up to ${fmt(d.maxDiscount)})` : "";
    return `${d.value}% off${cap}`;
  }
  if (d.discountType === "FIXED") return `${fmt(d.value)} off`;
  return "Buy 1 Get 1 (50% off)";
}

export function CouponSuggestions({
  subtotal,
  appliedCode,
  onApply,
}: CouponSuggestionsProps) {
  const [discounts, setDiscounts] = useState<ApiDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEligible = useCallback(async () => {
    if (subtotal <= 0) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/shop/discounts/eligible?subtotal=${Math.floor(subtotal)}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as { data: ApiDiscount[] };
      setDiscounts(json.data ?? []);
    } catch {
      // Non-critical — silently skip
    } finally {
      setIsLoading(false);
    }
  }, [subtotal]);

  useEffect(() => {
    void fetchEligible();
  }, [fetchEligible]);

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-8 w-36 animate-pulse rounded-full bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (discounts.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <HugeiconsIcon icon={Ticket01Icon} className="h-3.5 w-3.5" />
        Available for your order
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {discounts.map((d) => {
          const isApplied = appliedCode === d.code;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onApply(d.code)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95",
                isApplied
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                  : "border-border/60 bg-background/60 text-foreground/80 hover:border-foreground/40 hover:bg-background",
              )}
            >
              <span className="font-mono tracking-wide">{d.code}</span>
              <span className="text-muted-foreground">—</span>
              <span>{describeDiscount(d)}</span>
              {!isApplied && (
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="h-3 w-3 text-muted-foreground"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
