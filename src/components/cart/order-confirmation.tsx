"use client";

import {
  CheckmarkCircle02Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface OrderConfirmationProps {
  orderNumber: string;
  total: number;
  onContinue: () => void;
}

function fmt(n: number) {
  return `₹${Math.floor(n).toLocaleString("en-IN")}`;
}

export function OrderConfirmation({
  orderNumber,
  total,
  onContinue,
}: OrderConfirmationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Tiny delay so the CSS transition fires properly
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex flex-col items-center gap-6 py-10 text-center transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Animated checkmark */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="h-12 w-12 text-emerald-500"
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">Order Placed!</h2>
        <p className="text-sm text-muted-foreground">
          Order{" "}
          <span className="font-mono font-semibold text-foreground">
            #{orderNumber}
          </span>
        </p>
        <p className="text-base font-semibold">{fmt(total)}</p>
      </div>

      {/* WhatsApp message */}
      <div className="flex max-w-xs items-start gap-3 rounded-2xl border border-border/40 bg-card/60 p-4 text-left">
        <HugeiconsIcon
          icon={WhatsappIcon}
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
        />
        <p className="text-sm text-muted-foreground">
          Our team will reach out to you on{" "}
          <span className="font-semibold text-foreground">WhatsApp</span>{" "}
          shortly to confirm your delivery details.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/profile/orders"
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-border/50 bg-card/60 text-sm font-semibold transition-all hover:bg-card active:scale-[0.98]"
        >
          View My Orders
        </Link>
        <button
          type="button"
          onClick={onContinue}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background transition-all active:scale-[0.98]"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
