"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/stores/shop.store";

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface NewArrivalsSectionProps {
  products: CatalogProduct[];
  onProductClick: (product: CatalogProduct) => void;
}

export function NewArrivalsSection({
  products,
  onProductClick,
}: NewArrivalsSectionProps) {
  const [shuffledProducts, setShuffledProducts] = useState<CatalogProduct[]>(
    [],
  );
  const _productsKey = products
    .slice(0, 10)
    .map((p) => p.id)
    .join(",");

  useEffect(() => {
    setShuffledProducts(shuffle(products.slice(0, 10)));
  }, [products]);

  if (shuffledProducts.length === 0) return null;

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold tracking-tight">
          New Arrival
        </h2>
        <Link
          href="/shop?sort=newest"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          See all
        </Link>
      </div>

      <ScrollArea className="w-full">
        <div className="flex w-max gap-4 pb-4">
          {shuffledProducts.map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => onProductClick(product)}
              className="group w-[200px] flex-shrink-0 text-left sm:w-[240px]"
            >
              <div
                className={cn(
                  "relative aspect-[3/4] overflow-hidden rounded-3xl border border-border/50 bg-muted/40",
                )}
              >
                {product.thumbnailUrl ? (
                  <Image
                    src={product.thumbnailUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 200px, 240px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </section>
  );
}
