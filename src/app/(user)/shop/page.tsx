import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopContent } from "./shop-content";

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <Skeleton className="w-12 h-12 rounded-full mb-4" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
