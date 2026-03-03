"use client";

import { ShoppingCart01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BlurImage } from "@/components/ui/blur-image";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { type CatalogProduct, useShopStore } from "@/stores/shop.store";

interface ProductDrawerProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

export function ProductDrawer({
  product,
  isOpen,
  onOpenChange,
}: ProductDrawerProps) {
  const isDesktop = useIsDesktop();
  const fetchProductDetails = useShopStore(
    (state) => state.fetchProductDetails,
  );
  const fetchVariantMedia = useShopStore((state) => state.fetchVariantMedia);
  const [selection, setSelection] = useState<{
    color: string | null;
    size: string | null;
  }>({ color: null, size: null });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const selectedColor = selection.color;
  const selectedSize = selection.size;
  const details = useShopStore((state) =>
    product ? state.productDetailsById[product.id] : undefined,
  );
  const isLoadingDetails = useShopStore((state) =>
    product ? Boolean(state.loadingProductIds[product.id]) : false,
  );
  const variantImages = useShopStore((state) =>
    product && selectedColor
      ? state.variantMediaByProductId[product.id]?.[selectedColor]
      : undefined,
  );
  const isLoadingVariantImages = useShopStore((state) =>
    product && selectedColor
      ? Boolean(
          state.loadingVariantMediaByKey[`${product.id}:${selectedColor}`],
        )
      : false,
  );

  const { addItem, isLoading: isAddingToCart } = useCartStore();

  const variants = details?.variants ?? [];
  const inStockVariants = useMemo(
    () => variants.filter((variant) => variant.stock > 0),
    [variants],
  );

  useEffect(() => {
    if (!isOpen || !product) return;
    fetchProductDetails(product.id);
  }, [isOpen, product, fetchProductDetails]);

  useEffect(() => {
    if (!isOpen || !product || !selectedColor) return;
    fetchVariantMedia(product.id, selectedColor);
  }, [isOpen, product, selectedColor, fetchVariantMedia]);

  useEffect(() => {
    if (!product || !isOpen) return;
    setSelection({ color: null, size: null });
    setSelectedImageIndex(0);
  }, [product, isOpen]);

  useEffect(() => {
    // Reset image index when variants change
    setSelectedImageIndex(0);
  }, []);

  useEffect(() => {
    if (!isOpen || !product || variants.length === 0) return;

    const hasValidSelection = inStockVariants.some(
      (variant) =>
        variant.color === selectedColor && variant.size === selectedSize,
    );

    if (hasValidSelection) return;

    const preferredVariant =
      inStockVariants.find(
        (variant) =>
          variant.color === details?.defaultColor &&
          variant.size === details?.defaultSize,
      ) ??
      inStockVariants[0] ??
      variants[0];

    setSelection({
      color: preferredVariant?.color ?? null,
      size: preferredVariant?.size ?? null,
    });
  }, [
    isOpen,
    product,
    variants,
    inStockVariants,
    selectedColor,
    selectedSize,
    details?.defaultColor,
    details?.defaultSize,
  ]);

  const colorOptions = useMemo(
    () => Array.from(new Set(inStockVariants.map((variant) => variant.color))),
    [inStockVariants],
  );

  const sizeOptions = useMemo(() => {
    const sizes = inStockVariants
      .filter((variant) => !selectedColor || variant.color === selectedColor)
      .map((variant) => variant.size);
    return Array.from(new Set(sizes));
  }, [inStockVariants, selectedColor]);

  const selectedVariant = useMemo(
    () =>
      inStockVariants.find(
        (variant) =>
          variant.color === selectedColor && variant.size === selectedSize,
      ) ?? null,
    [inStockVariants, selectedColor, selectedSize],
  );

  const galleryImages = useMemo(() => {
    if (variantImages?.length) return variantImages;
    if (selectedVariant?.previewImage) return [selectedVariant.previewImage];
    const firstWithPreview = inStockVariants.find(
      (variant) => variant.previewImage,
    );
    if (firstWithPreview?.previewImage) return [firstWithPreview.previewImage];
    return product?.thumbnailUrl ? [product.thumbnailUrl] : [];
  }, [variantImages, selectedVariant, inStockVariants, product]);

  const handleColorSelect = (color: string) => {
    const nextSize =
      inStockVariants.find(
        (variant) => variant.color === color && variant.size === selectedSize,
      )?.size ??
      inStockVariants.find((variant) => variant.color === color)?.size ??
      null;

    setSelection({ color, size: nextSize });
  };

  const handleSizeSelect = (size: string) => {
    const nextColor =
      inStockVariants.find(
        (variant) => variant.size === size && variant.color === selectedColor,
      )?.color ??
      inStockVariants.find((variant) => variant.size === size)?.color ??
      null;

    setSelection({ color: nextColor, size });
  };

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) {
      toast.error("Please choose an available color and size");
      return;
    }

    try {
      await addItem({
        productVariantId: selectedVariant.id,
        quantity: 1,
        productName: product.name,
        productPrice: product.price,
        productImage:
          galleryImages[0] ||
          selectedVariant.previewImage ||
          product.thumbnailUrl ||
          null,
        size: selectedVariant.size,
        color: selectedVariant.color,
        stock: selectedVariant.stock,
      });
      toast.success("Added to cart");
      onOpenChange(false);
    } catch {
      // Store already handles error and optimistic rollback.
    }
  };

  const isUnavailable = !isLoadingDetails && inStockVariants.length === 0;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      direction={isDesktop ? "right" : "bottom"}
    >
      <DrawerContent
        className={cn(
          "overflow-hidden p-0",
          "data-[vaul-drawer-direction=bottom]:max-h-[94vh] data-[vaul-drawer-direction=bottom]:rounded-t-2xl",
          "data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-2xl",
        )}
      >
        <div
          className={cn(
            "grid h-full grid-cols-1",
            isDesktop && "md:grid-cols-[1.05fr_1fr]",
          )}
        >
          <div
            className={cn(
              "relative flex flex-col bg-muted/20 pb-4 h-[45vh]",
              isDesktop && "h-full pb-0",
            )}
          >
            {/* Main Image */}
            <div className="relative flex-1 overflow-hidden">
              {galleryImages.length > 0 ? (
                <BlurImage
                  src={galleryImages[selectedImageIndex] ?? galleryImages[0]}
                  alt={product?.name ?? "Product image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground bg-muted/40">
                  No image available
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="mt-3 px-4 md:absolute md:bottom-6 md:left-0 md:w-full md:px-6 md:mt-0 md:bg-transparent">
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none md:justify-center">
                  {galleryImages.map((image, idx) => (
                    <button
                      type="button"
                      // biome-ignore lint/suspicious/noArrayIndexKey: images might not have unique IDs
                      key={`thumb-${idx}`}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={cn(
                        "relative h-16 w-12 shrink-0 overflow-hidden rounded-md border-2 transition-all md:h-20 md:w-16 md:shadow-sm md:rounded-lg",
                        selectedImageIndex === idx
                          ? "border-primary md:border-foreground md:scale-105"
                          : "border-transparent opacity-60 hover:opacity-100",
                      )}
                    >
                      <BlurImage
                        src={image}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {product?.categoryName || "Product"}
              </p>
              <DrawerTitle className="mt-2 text-2xl font-semibold tracking-tight">
                {product?.name}
              </DrawerTitle>
              <p className="mt-2 text-2xl font-semibold">
                {currencyFormatter.format(product?.price ?? 0)}
              </p>

              <div className="mt-8 space-y-6">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Color</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedColor ?? "Not selected"}
                    </p>
                  </div>
                  {isLoadingDetails ? (
                    <div className="flex gap-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton
                          key={`color-skeleton-${index.toString()}`}
                          className="h-10 w-16 rounded-xl"
                        />
                      ))}
                    </div>
                  ) : colorOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                            selectedColor === color
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-foreground hover:border-foreground/40",
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No colors available
                    </p>
                  )}
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium">Size</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSize ?? "Not selected"}
                    </p>
                  </div>
                  {isLoadingDetails ? (
                    <div className="flex gap-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton
                          key={`size-skeleton-${index.toString()}`}
                          className="h-10 w-12 rounded-xl"
                        />
                      ))}
                    </div>
                  ) : sizeOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          className={cn(
                            "min-w-12 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                            selectedSize === size
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-foreground hover:border-foreground/40",
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No sizes available
                    </p>
                  )}
                </section>
              </div>

              {details && (
                <div className="mt-8 space-y-4 border-t pt-6">
                  {details.description && (
                    <div>
                      <p className="text-sm font-medium">Description</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {details.description}
                      </p>
                    </div>
                  )}

                  {(details.material || details.fabric) && (
                    <div>
                      <p className="text-sm font-medium">Material & Fabric</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[details.material, details.fabric]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                  )}

                  {details.fit && (
                    <div>
                      <p className="text-sm font-medium">Fit</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {details.fit}
                      </p>
                    </div>
                  )}

                  {details.careInstruction && (
                    <div>
                      <p className="text-sm font-medium">Care Instructions</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {details.careInstruction}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t bg-background px-5 py-4">
              <Button
                size="lg"
                className="h-12 w-full rounded-xl"
                onClick={handleAddToCart}
                disabled={
                  isLoadingDetails ||
                  isLoadingVariantImages ||
                  isAddingToCart ||
                  !selectedVariant
                }
              >
                <HugeiconsIcon
                  icon={ShoppingCart01Icon}
                  className="mr-2 h-5 w-5"
                />
                {isUnavailable ? "Out of stock" : "Add to cart"}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Free delivery on orders over {currencyFormatter.format(3000)}
              </p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
