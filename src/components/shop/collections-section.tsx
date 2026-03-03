"use client";

import Image from "next/image";
import { useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
}

interface CollectionsSectionProps {
  categories: Category[];
  onCategoryClick: (slug: string) => void;
}

export function CollectionsSection({
  categories,
  onCategoryClick,
}: CollectionsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  if (categories.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold tracking-tight">
          Collections
        </h2>
        <button
          type="button"
          className="active:scale-95 text-sm text-muted-foreground transition-all hover:text-foreground"
          onClick={() => {
            const scopedQuery = sectionRef.current?.querySelector(
              '[data-slot="scroll-area-viewport"]',
            );
            scopedQuery?.scrollTo({
              left: scopedQuery.scrollWidth,
              behavior: "smooth",
            });
          }}
        >
          See all
        </button>
      </div>

      <ScrollArea className="w-full">
        <div className="flex w-max gap-4 pb-4">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => onCategoryClick(category.slug)}
              className="active:scale-95 group flex flex-col items-center gap-2 transition-transform"
            >
              <div className="relative h-32 w-20 overflow-hidden rounded-full border border-border/50 bg-muted/40 transition-transform duration-300 group-hover:scale-[1.03]">
                {category.thumbnailUrl ? (
                  <Image
                    src={category.thumbnailUrl}
                    alt={category.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                    <span className="text-2xl font-semibold text-muted-foreground">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className="max-w-20 truncate text-sm font-medium">
                {category.name}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </section>
  );
}
