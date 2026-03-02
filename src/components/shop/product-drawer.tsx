"use client";

import { ShoppingCart01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { useProductStore } from "@/stores/product.store";
import type { CatalogProduct } from "@/stores/shop.store";

interface ProductDrawerProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDrawer({
  product,
  isOpen,
  onOpenChange,
}: ProductDrawerProps) {
  const { fetchProduct, product: fullProduct, isLoading } = useProductStore();
  const { addItem } = useCartStore();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Fetch full details when drawer opens
  useEffect(() => {
    if (isOpen && product) {
      fetchProduct(product.id);
      setSelectedColor(null); // Reset selection
      setSelectedSize(null);
    }
  }, [isOpen, product, fetchProduct]);

  // Determine current variant based on selection
  const variants = fullProduct?.variants || [];

  // Get unique colors and sizes
  const availableColors = Array.from(new Set(variants.map((v) => v.color)));

  // Filter sizes based on selected color (or show all if no color selected)
  const availableSizes = variants
    .filter((v) => !selectedColor || v.color === selectedColor)
    .map((v) => v.size);

  const uniqueSizes = Array.from(new Set(availableSizes));

  // Determine which images to show in the gallery
  const galleryImages = variants.find((v) => v.color === selectedColor)?.images
    ?.length
    ? variants.find((v) => v.color === selectedColor)?.images
    : product?.thumbnailUrl
      ? [product.thumbnailUrl]
      : [];

  const handleAddToCart = async () => {
    if (!product || !fullProduct) return;

    if (!selectedColor || !selectedSize) {
      toast.error("Please select a color and size");
      return;
    }

    const variant = variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize,
    );
    if (!variant) {
      toast.error("Selected variant is not available");
      return;
    }

    try {
      await addItem({
        productVariantId: variant.id,
        quantity: 1,
        productName: product.name,
        productPrice: product.price,
        productImage: variant.images?.[0] || product.thumbnailUrl || null,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
      });
      toast.success("Added to cart");
      onOpenChange(false);
    } catch (_err) {
      // Error is handled by store
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] p-0 flex flex-col rounded-t-2xl overflow-hidden">
        {/* Visual Gallery */}
        <div className="relative w-full h-[45vh] bg-secondary/50 shrink-0">
          {(galleryImages || []).length > 0 ? (
            <ScrollArea className="w-full h-full whitespace-nowrap">
              <div className="flex w-max h-full">
                {(galleryImages || []).map((url, index) => (
                  <div key={url} className="relative w-screen h-full shrink-0">
                    <Image
                      src={url}
                      alt={product?.name || "Product image"}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image available
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6 pb-24">
            {/* Header */}
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                {product?.categoryName || "Product"}
              </p>
              <DrawerTitle className="text-2xl font-bold mb-2">
                {product?.name}
              </DrawerTitle>
              <p className="text-3xl font-bold">
                ₹{product?.price.toLocaleString() || "0"}
              </p>
            </div>

            {/* Variant Selectors */}
            <div className="space-y-6">
              {/* Colors */}
              <div>
                <p className="text-sm font-medium mb-3">
                  Color{" "}
                  <span className="text-muted-foreground ml-1">
                    • {selectedColor || "Select"}
                  </span>
                </p>
                {isLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton
                        key={i}
                        className="w-12 h-16 rounded-md animate-pulse"
                      />
                    ))}
                  </div>
                ) : availableColors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const v = variants.find((v) => v.color === color);
                      return (
                        <button
                          type="button"
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "relative w-12 h-16 rounded-md overflow-hidden border-2 transition-all active:scale-95",
                            selectedColor === color
                              ? "border-primary"
                              : "border-transparent ring-1 ring-border/50 hover:ring-border",
                          )}
                        >
                          {v?.images[0] ? (
                            <Image
                              src={v.images[0]}
                              alt={color}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-secondary/50 flex items-center justify-center text-[10px]">
                              {color}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No colors available
                  </p>
                )}
              </div>

              {/* Sizes */}
              <div>
                <p className="text-sm font-medium mb-3">
                  Size{" "}
                  <span className="text-muted-foreground ml-1">
                    • {selectedSize || "Select"}
                  </span>
                </p>
                {isLoading ? (
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton
                        key={i}
                        className="w-16 h-10 rounded-md animate-pulse"
                      />
                    ))}
                  </div>
                ) : uniqueSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {uniqueSizes.map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-md border transition-all active:scale-95 min-w-[3rem]",
                          selectedSize === size
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-foreground/50",
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a color to see sizes
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Sticky Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-3 items-center">
            <Button
              size="lg"
              className="flex-1 rounded-xl h-14 text-base active:scale-95 transition-transform"
              onClick={handleAddToCart}
              disabled={isLoading || !selectedColor || !selectedSize}
            >
              <HugeiconsIcon
                icon={ShoppingCart01Icon}
                className="w-5 h-5 mr-2"
              />
              Add to cart
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-14 w-14 rounded-xl shrink-0 active:scale-95 transition-transform"
            >
              <HugeiconsIcon icon={StarIcon} className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[10px]">
              🚚
            </span>
            Free delivery on orders over ₹3000
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
