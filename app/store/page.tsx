export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductCard, { Product } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

function ProductSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
        </div>
    );
}

function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
            ))}
        </div>
    );
}

async function ProductGrid() {
    const supabase = createServerSupabaseClient();

    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching products:", error);
        return (
            <p className="text-center text-muted-foreground">
                Failed to load products.
            </p>
        );
    }

    if (!products?.length) {
        return (
            <p className="text-center text-muted-foreground">
                No products available.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}

export default function StorePage() {
    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Our Collection
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Browse our premium selection of clothing.
                </p>
            </div>

            <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid />
            </Suspense>
        </div>
    );
}
