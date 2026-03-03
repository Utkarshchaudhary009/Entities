"use client";

import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CartItemsList } from "@/components/cart/cart-items-list";
import { CheckoutDrawer } from "@/components/cart/checkout-drawer";
import { CouponInput } from "@/components/cart/coupon-input";
import { CouponSuggestions } from "@/components/cart/coupon-suggestions";
import { PriceBreakdown } from "@/components/cart/price-breakdown";
import { Button } from "@/components/ui/button";
import {
  useCartCount,
  useCartItems,
  useCartStore,
  useCartTotal,
} from "@/stores/cart.store";

interface ValidatedCoupon {
  code: string;
  discountAmount: number;
  finalTotal: number;
}

interface CartPageContentProps {
  geoCity?: string;
  geoRegion?: string;
}

/** Reads or creates a guest session ID stored in localStorage */
function getSessionId(): string {
  const key = "entities_cart_session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function CartPageContent({
  geoCity = "",
  geoRegion = "",
}: CartPageContentProps) {
  const router = useRouter();
  const _total = useCartTotal();
  const itemCount = useCartCount();
  const items = useCartItems();
  const setSessionId = useCartStore((s) => s.setSessionId);
  const syncWithServer = useCartStore((s) => s.syncWithServer);
  const clearCart = useCartStore((s) => s.clearCart);
  const sessionId = useCartStore((s) => s.sessionId);

  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(
    null,
  );
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Initialize session and sync with server on mount
  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    void syncWithServer();
  }, [setSessionId, syncWithServer]);

  const subtotal = items.reduce(
    (sum, item) => sum + Math.floor(item.productPrice) * item.quantity,
    0,
  );
  const discountAmount = appliedCoupon?.discountAmount ?? 0;

  const handleCouponApplied = useCallback((coupon: ValidatedCoupon | null) => {
    setAppliedCoupon(coupon);
    setPendingCode(null);
  }, []);

  const handleSuggestionApply = useCallback((code: string) => {
    setPendingCode(code);
  }, []);

  const handleClearCart = async () => {
    await clearCart();
    setAppliedCoupon(null);
    toast.success("Cart cleared");
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-24 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/60 transition-colors hover:bg-muted active:scale-95"
            aria-label="Go back"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Your Bag
            </p>
            <h1 className="text-xl font-bold leading-tight">
              {itemCount > 0
                ? `${itemCount} ${itemCount === 1 ? "item" : "items"}`
                : "Empty cart"}
            </h1>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => void handleClearCart()}
            className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive active:scale-95"
          >
            <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Items list */}
      <CartItemsList />

      {items.length > 0 && (
        <>
          {/* Coupon section */}
          <div className="mt-8 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Have a coupon?
            </p>
            <CouponSuggestions
              subtotal={subtotal}
              appliedCode={appliedCoupon?.code ?? null}
              onApply={handleSuggestionApply}
            />
            <CouponInput
              subtotal={subtotal}
              appliedCoupon={appliedCoupon}
              onCouponApplied={handleCouponApplied}
              pendingCode={pendingCode}
            />
          </div>

          {/* Price breakdown */}
          <div className="mt-6">
            <PriceBreakdown
              subtotal={subtotal}
              discountAmount={discountAmount}
              discountCode={appliedCoupon?.code}
              itemCount={itemCount}
            />
          </div>

          {/* Place Order CTA */}
          <div className="mt-6">
            <Button
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-bold tracking-wide transition-all active:scale-[0.98]"
              onClick={() => setIsCheckoutOpen(true)}
            >
              Place Order
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              No payment needed — we&apos;ll confirm on WhatsApp
            </p>
          </div>
        </>
      )}

      {/* Checkout Drawer */}
      {sessionId && (
        <CheckoutDrawer
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          sessionId={sessionId}
          discountCode={appliedCoupon?.code ?? null}
          geoCity={geoCity}
          geoRegion={geoRegion}
        />
      )}
    </div>
  );
}
