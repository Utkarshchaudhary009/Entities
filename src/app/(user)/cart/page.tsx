import { headers } from "next/headers";
import { Suspense } from "react";
import { CartPageSkeleton } from "@/app/(user)/cart/loading";
import { CartPageContent } from "@/components/cart/cart-page-content";

export const metadata = {
  title: "Your Cart — Entities",
  description: "Review your items and place your order.",
};

export default async function CartPage() {
  // Read Vercel geo-hint headers as best-effort city/state pre-fill
  const headerStore = await headers();
  const geoCity = headerStore.get("x-vercel-ip-city") ?? "";
  const geoRegion = headerStore.get("x-vercel-ip-country-region") ?? "";

  return (
    <Suspense fallback={<CartPageSkeleton />}>
      <CartPageContent
        geoCity={decodeURIComponent(geoCity)}
        geoRegion={geoRegion}
      />
    </Suspense>
  );
}
