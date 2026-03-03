"use client";

import { Search02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CollectionsSection } from "@/components/shop/collections-section";
import { NewArrivalsSection } from "@/components/shop/new-arrivals-section";
import { ProductDrawer } from "@/components/shop/product-drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/stores/category.store";
import { type CatalogProduct, useShopStore } from "@/stores/shop.store";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const sortParam = searchParams.get("sort");

  const fetchCatalog = useShopStore((state) => state.fetchCatalog);
  const fetchProductDetails = useShopStore(
    (state) => state.fetchProductDetails,
  );
  const catalog = useShopStore((state) => state.catalog);
  const filteredCatalog = useShopStore((state) => state.filteredCatalog);
  const searchQuery = useShopStore((state) => state.searchQuery);
  const setSearchQuery = useShopStore((state) => state.setSearchQuery);
  const isLoadingCatalog = useShopStore((state) => state.isLoadingCatalog);

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
  }, [fetchCatalog, fetchCategories]);

  const displayedProducts = useMemo(() => {
    const base = searchQuery.trim() ? filteredCatalog : catalog;
    if (!categorySlug) return base;
    return base.filter((product) => product.categorySlug === categorySlug);
  }, [searchQuery, filteredCatalog, catalog, categorySlug]);

  const showDefaultView = !searchQuery.trim() && !categorySlug && !sortParam;

  const activeCategoryName = useMemo(
    () => categories.find((item) => item.slug === categorySlug)?.name ?? "All",
    [categories, categorySlug],
  );

  const sectionTitle = searchQuery.trim()
    ? `Results for "${searchQuery.trim()}"`
    : categorySlug
      ? activeCategoryName
      : "All Products";

  const isInitialLoading = isLoadingCatalog && catalog.length === 0;

  const handleProductClick = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const setCategory = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("category", slug);
    else params.delete("category");
    const query = params.toString();
    router.replace(query ? `/shop?${query}` : "/shop", { scroll: false });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background via-background to-muted/20 pb-24">
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-6 lg:px-10">
        <div className="sticky top-16 z-30 -mx-4 border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Entities Shop
          </p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Designed for daily wear
            </h1>
            <p className="hidden text-sm text-muted-foreground md:block">
              Fast product browsing with quick detail view.
            </p>
          </div>
          <div className="relative mt-4">
            <HugeiconsIcon
              icon={Search02Icon}
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search by product or category"
              className="h-12 w-full rounded-2xl border-border/70 bg-background pl-10 pr-4 text-base shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {showDefaultView ? (
          <>
            <NewArrivalsSection
              products={catalog}
              onProductClick={handleProductClick}
            />
            <CollectionsSection
              categories={categories}
              onCategoryClick={setCategory}
            />
          </>
        ) : (
          <div className="pt-5">
            {isLoadingCategories ? (
              <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton
                    key={`category-loading-${index.toString()}`}
                    className="h-9 w-24 rounded-full"
                  />
                ))}
              </div>
            ) : (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory(null)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      !categorySlug
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/40",
                    )}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() =>
                        setCategory(
                          categorySlug === category.slug ? null : category.slug,
                        )
                      }
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        categorySlug === category.slug
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:border-foreground/40",
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            )}

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {sectionTitle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {displayedProducts.length.toLocaleString()} products
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {isInitialLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`catalog-loading-${index.toString()}`}
                    className="space-y-2"
                  >
                    <Skeleton className="aspect-[4/5] rounded-2xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : displayedProducts.length > 0 ? (
                displayedProducts.map((product) => (
                  <button
                    type="button"
                    key={product.id}
                    onMouseEnter={() => fetchProductDetails(product.id)}
                    onClick={() => handleProductClick(product)}
                    className="group text-left"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/50 bg-muted/40">
                      {product.thumbnailUrl ? (
                        <Image
                          src={product.thumbnailUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="absolute inset-x-3 bottom-3 rounded-xl bg-background/78 px-3 py-2 backdrop-blur-md">
                        <p className="line-clamp-1 text-sm font-medium leading-tight">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {product.categoryName ?? "Essential"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-base font-semibold">
                      {currencyFormatter.format(product.price)}
                    </p>
                  </button>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-border/80 bg-muted/20 py-14 text-center">
                  <HugeiconsIcon
                    icon={Search02Icon}
                    className="mx-auto mb-3 h-10 w-10 text-muted-foreground/55"
                  />
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm text-muted-foreground">
                    Try changing your search or category filter.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ProductDrawer
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
