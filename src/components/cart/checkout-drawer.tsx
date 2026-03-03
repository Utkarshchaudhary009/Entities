"use client";

import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loading03Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { OrderConfirmation } from "@/components/cart/order-confirmation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { UserAddress } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { createOrderSchema } from "@/lib/validations/order";
import { useCartStore } from "@/stores/cart.store";
import { useUserAddressStore } from "@/stores/user-address.store";

type CheckoutFormValues = z.infer<typeof createOrderSchema>;

interface CheckoutDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string;
  discountCode?: string | null;
  /** Vercel geo-hint for city pre-fill */
  geoCity?: string;
  /** Vercel geo-hint for state pre-fill */
  geoRegion?: string;
}

export function CheckoutDrawer({
  open,
  onOpenChange,
  sessionId,
  discountCode,
  geoCity = "",
  geoRegion = "",
}: CheckoutDrawerProps) {
  const { isSignedIn } = useAuth();
  const {
    addresses,
    isLoading: isLoadingAddresses,
    fetchAddresses,
  } = useUserAddressStore();
  const syncWithServer = useCartStore((s) => s.syncWithServer);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    total: number;
  } | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      sessionId,
      city: geoCity,
      state: geoRegion,
    },
  });

  // Priority 1: Load saved addresses (DB) when drawer opens
  useEffect(() => {
    if (open && isSignedIn) {
      void fetchAddresses();
    }
  }, [open, isSignedIn, fetchAddresses]);

  const applyAddress = useCallback(
    (addr: UserAddress) => {
      setValue("customerName", addr.name);
      setValue("whatsappNumber", addr.phone);
      setValue("address", addr.address);
      setValue("city", addr.city);
      setValue("state", addr.state);
      setValue("pincode", addr.pincode);
      setSelectedAddressId(addr.id);
    },
    [setValue],
  );

  // Priority 1: Pre-fill from default saved address
  useEffect(() => {
    if (addresses.length === 0) return;
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    applyAddress(defaultAddr);
    setSelectedAddressId(defaultAddr.id);
  }, [addresses, applyAddress]);

  async function onSubmit(data: CheckoutFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          sessionId,
          ...(discountCode ? { discountCode } : {}),
        }),
      });
      const json = (await res.json()) as {
        data?: { orderNumber: string; total: number };
        error?: string;
      };

      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to place order");
      }

      // Save new address to DB if user opted in and not already saved
      if (saveAddress && isSignedIn && !selectedAddressId) {
        const { addAddress } = useUserAddressStore.getState();
        void addAddress({
          label: "Home",
          name: data.customerName,
          phone: data.whatsappNumber,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          isDefault: addresses.length === 0,
        });
      }

      // Order placed successfully — sync cart (now empty) and show confirmation
      await syncWithServer();
      setConfirmedOrder({
        orderNumber: json.data.orderNumber,
        total: json.data.total,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      console.error("[CheckoutDrawer] onSubmit FAILED:", msg);
      // Surface error to user via toast (sonner is available globally)
      const { toast } = await import("sonner");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (confirmedOrder) {
      reset();
      setConfirmedOrder(null);
      setSaveAddress(false);
      setSelectedAddressId(null);
    }
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-lg">
        <div className="overflow-y-auto px-5 pb-8">
          {confirmedOrder ? (
            <OrderConfirmation
              orderNumber={confirmedOrder.orderNumber}
              total={confirmedOrder.total}
              onContinue={handleClose}
            />
          ) : (
            <>
              <DrawerHeader className="px-0 pb-2 pt-6">
                <DrawerTitle className="text-xl font-bold">
                  Delivery Details
                </DrawerTitle>
                <p className="text-sm text-muted-foreground">
                  Your order will be confirmed on WhatsApp after placement.
                </p>
              </DrawerHeader>

              {/* Saved address selector */}
              {isSignedIn && (
                <div className="mb-5 space-y-2">
                  {isLoadingAddresses ? (
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-32 rounded-full" />
                      <Skeleton className="h-9 w-28 rounded-full" />
                    </div>
                  ) : addresses.length > 0 ? (
                    <>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <HugeiconsIcon
                          icon={Location01Icon}
                          className="h-3.5 w-3.5"
                        />
                        Saved addresses
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {addresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => applyAddress(addr)}
                            className={cn(
                              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                              selectedAddressId === addr.id
                                ? "border-foreground bg-foreground text-background"
                                : "border-border/50 bg-background/60 text-foreground/80 hover:border-foreground/40",
                            )}
                          >
                            {addr.label}
                            {addr.isDefault && (
                              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-500">
                                DEFAULT
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <input
                  type="hidden"
                  {...register("sessionId")}
                  value={sessionId}
                />

                <FormField
                  id="customerName"
                  label="Full Name"
                  error={errors.customerName?.message}
                >
                  <Input
                    id="customerName"
                    {...register("customerName")}
                    placeholder="Your full name"
                    autoComplete="name"
                    className="rounded-xl border-border/50 bg-background/60"
                  />
                </FormField>

                <FormField
                  id="whatsappNumber"
                  label="WhatsApp Number"
                  error={errors.whatsappNumber?.message}
                >
                  <Input
                    id="whatsappNumber"
                    {...register("whatsappNumber")}
                    type="tel"
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                    inputMode="tel"
                    className="rounded-xl border-border/50 bg-background/60"
                  />
                </FormField>

                <FormField
                  id="email"
                  label="Email (optional)"
                  error={errors.email?.message}
                >
                  <Input
                    id="email"
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="rounded-xl border-border/50 bg-background/60"
                  />
                </FormField>

                <FormField
                  id="address"
                  label="Street Address"
                  error={errors.address?.message}
                >
                  <Textarea
                    id="address"
                    {...register("address")}
                    placeholder="House/Flat No., Building, Street"
                    autoComplete="street-address"
                    rows={2}
                    className="resize-none rounded-xl border-border/50 bg-background/60"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    id="city"
                    label="City"
                    error={errors.city?.message}
                  >
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="City"
                      autoComplete="address-level2"
                      className="rounded-xl border-border/50 bg-background/60"
                    />
                  </FormField>
                  <FormField
                    id="state"
                    label="State"
                    error={errors.state?.message}
                  >
                    <Input
                      id="state"
                      {...register("state")}
                      placeholder="State"
                      autoComplete="address-level1"
                      className="rounded-xl border-border/50 bg-background/60"
                    />
                  </FormField>
                </div>

                <FormField
                  id="pincode"
                  label="Pincode"
                  error={errors.pincode?.message}
                >
                  <Input
                    id="pincode"
                    {...register("pincode")}
                    placeholder="6-digit pincode"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    className="rounded-xl border-border/50 bg-background/60"
                  />
                </FormField>

                {/* Save address checkbox — only for logged-in users without saved addresses */}
                {isSignedIn && addresses.length === 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="saveAddress"
                      checked={saveAddress}
                      onCheckedChange={(v) => setSaveAddress(v === true)}
                    />
                    <Label
                      htmlFor="saveAddress"
                      className="cursor-pointer text-sm font-normal text-muted-foreground"
                    >
                      Save this address for future orders
                    </Label>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-13 w-full rounded-2xl text-base font-bold transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="h-4 w-4 animate-spin"
                      />
                      Placing order…
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  No payment needed now — our team will contact you on WhatsApp.
                </p>
              </form>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
