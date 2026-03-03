"use client";

import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ValidatedCoupon {
  code: string;
  discountAmount: number;
  finalTotal: number;
}

interface CouponInputProps {
  subtotal: number;
  onCouponApplied: (coupon: ValidatedCoupon | null) => void;
  appliedCoupon: ValidatedCoupon | null;
  /** Pre-fills the input (used when tapping a suggestion chip) */
  pendingCode?: string | null;
}

export function CouponInput({
  subtotal,
  onCouponApplied,
  appliedCoupon,
  pendingCode,
}: CouponInputProps) {
  const [code, setCode] = useState(pendingCode ?? "");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if parent injects a pending code from a chip tap
  if (pendingCode && pendingCode !== code && status !== "success") {
    setCode(pendingCode);
  }

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/shop/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal: Math.floor(subtotal) }),
      });
      const json = (await res.json()) as {
        data?: ValidatedCoupon;
        error?: string;
      };

      if (!res.ok || !json.data) {
        setStatus("error");
        setErrorMsg(json.error ?? "Invalid coupon code");
        // Shake animation via temporary class
        inputRef.current?.classList.add("animate-shake");
        setTimeout(
          () => inputRef.current?.classList.remove("animate-shake"),
          600,
        );
        return;
      }

      setStatus("success");
      onCouponApplied(json.data);
    } catch {
      setStatus("error");
      setErrorMsg("Could not validate coupon. Please try again.");
    }
  }

  function handleRemove() {
    setCode("");
    setStatus("idle");
    setErrorMsg("");
    onCouponApplied(null);
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="h-4 w-4 text-emerald-500"
          />
          <div>
            <span className="font-mono text-sm font-bold tracking-wide text-emerald-500">
              {appliedCoupon.code}
            </span>
            <span className="ml-2 text-xs text-emerald-600">
              — saving ₹
              {Math.floor(appliedCoupon.discountAmount).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-90"
          aria-label="Remove coupon"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-xl border bg-card/60 transition-all duration-300",
          status === "loading" &&
            "animate-pulse border-foreground/40 bg-gradient-to-r from-card/60 via-muted/30 to-card/60 bg-[length:200%] [animation:shimmer_1.5s_ease-in-out_infinite]",
          status === "error" && "border-destructive/60",
          status === "idle" &&
            "border-border/50 focus-within:border-foreground/40",
        )}
      >
        <HugeiconsIcon
          icon={Ticket01Icon}
          className="ml-4 h-4 w-4 shrink-0 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (status === "error") {
              setStatus("idle");
              setErrorMsg("");
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && void handleApply()}
          placeholder="Enter coupon code"
          className="flex-1 bg-transparent px-3 py-3 text-sm font-mono font-medium tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:outline-none"
          disabled={status === "loading"}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={status === "loading" || !code.trim()}
          className="mr-1.5 flex h-8 min-w-[60px] items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-semibold text-background transition-all active:scale-95 disabled:opacity-50"
        >
          {status === "loading" ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="h-3.5 w-3.5 animate-spin"
            />
          ) : (
            "Apply"
          )}
        </button>
      </div>

      {status === "error" && errorMsg && (
        <p className="animate-fade-in text-xs font-medium text-destructive">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
