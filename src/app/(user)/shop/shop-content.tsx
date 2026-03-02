"use client";

import { ArrowLeft01Icon, Search02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductDrawer } from "@/components/shop/product-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/stores/category.store";
import { useProductStore } from "@/stores/product.store";
import { type CatalogProduct, useShopStore } from "@/stores/shop.store";
import type { ApiProduct } from "@/types/api";

// Extended product type that includes category data returned at runtime
type ProductWithCategory = ApiProduct & {
  category?: { slug: string; name: string } | null;
};

export function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");

  const {
    fetchCatalog,
    searchQuery,
    setSearchQuery,
    filteredCatalog,
    isLoadingCatalog,
  } = useShopStore();
  const {
    fetchProducts,
    products: newArrivals,
    isLoading: isLoadingArrivals,
  } = useProductStore();
  const {
    fetchAll: fetchCategories,
    items: categories,
    isLoading: isLoadingCategories,
  } = useCategoryStore();

  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchCatalog();
    fetchCategories();
    // Fetch new arrivals (limit 12, newest first)
    fetchProducts({ sort: "newest", limit: 12 });
  }, [fetchCatalog, fetchCategories, fetchProducts]);

  const displayedProducts = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return filteredCatalog;
    }

    if (categorySlug) {
      return filteredCatalog.filter((p) => p.categorySlug === categorySlug);
    }

    // Default: return New Arrivals (mapped to CatalogProduct shape to match the drawer's expected type)
    return newArrivals.map((p: ProductWithCategory) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      thumbnailUrl: p.thumbnailUrl,
      categorySlug: p.category?.slug || null,
      categoryName: p.category?.name || null,
    }));
  }, [searchQuery, filteredCatalog, categorySlug, newArrivals]);

  const handleProductClick = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b px-4 py-3 shadow-sm">
        <div className="flex gap-2 items-center">
          {categorySlug && !searchQuery ? (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={() => router.push("/shop")}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
            </Button>
          ) : null}
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={Search02Icon}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 h-12 bg-secondary/50 border-transparent focus-visible:bg-background rounded-xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Categories Bar (Only show when not searching) */}
        {!searchQuery && (
          <div className="py-4">
            {isLoadingCategories ? (
              <div className="flex gap-4 px-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={`cat-skel-${i}`}
                    className="flex flex-col items-center gap-2 shrink-0"
                  >
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <Skeleton className="w-12 h-3 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max gap-4 px-4">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() =>
                        router.push(
                          categorySlug === cat.slug
                            ? "/shop"
                            : `/shop?category=${cat.slug}`,
                        )
                      }
                      className="flex flex-col items-center gap-2 group outline-none active:scale-95 transition-transform"
                    >
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-secondary/30",
                          categorySlug === cat.slug
                            ? "border-primary"
                            : "border-transparent",
                        )}
                      >
                        {cat.thumbnailUrl ? (
                          <Image
                            src={cat.thumbnailUrl}
                            alt={cat.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {cat.name[0]}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          categorySlug === cat.slug
                            ? "text-primary font-bold"
                            : "text-foreground group-hover:text-primary/70",
                        )}
                      >
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            )}
          </div>
        )}

        {/* Section Title */}
        <div className="px-4 pb-4">
          <h2 className="text-xl font-bold">
            {searchQuery
              ? `Search Results (${displayedProducts.length})`
              : categorySlug
                ? `${categories.find((c) => c.slug === categorySlug)?.name || "Category"}`
                : "New Arrivals"}
          </h2>
        </div>

        {/* Product Grid */}
        <div className="px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(isLoadingCatalog && searchQuery) ||
          (!searchQuery && isLoadingArrivals) ? (
            // Loading Skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i.toString()} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))
          ) : displayedProducts.length > 0 ? (
            displayedProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                className="group flex flex-col text-left active:scale-95 transition-transform"
                onClick={() => handleProductClick(product)}
              >
                <div className="relative aspect-square w-full rounded-xl bg-secondary/30 overflow-hidden mb-3">
                  {product.thumbnailUrl ? (
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                      No Image
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {product.categoryName && (
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {product.categoryName}
                    </p>
                  )}
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p className="font-bold text-base">
                    ₹{product.price.toLocaleString()}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full py-12 text-center flex flex-col items-center justify-center text-muted-foreground">
              <HugeiconsIcon
                icon={Search02Icon}
                className="w-12 h-12 mb-4 opacity-20"
              />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Drawer */}
      <ProductDrawer
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
