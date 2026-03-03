"use client";

import Image from "next/image";
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
  if (categories.length === 0) return null;

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold tracking-tight">
          Collections
        </h2>
        <button
          type="button"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            const scrollArea = document.querySelector(
              '[data-slot="scroll-area-viewport"]',
            );
            scrollArea?.scrollTo({
              left: scrollArea.scrollWidth,
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
              className="group flex flex-col items-center gap-2"
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
