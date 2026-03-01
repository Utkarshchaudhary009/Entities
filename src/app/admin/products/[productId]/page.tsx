"use client";

import {
  Add01Icon,
  ArrowLeft01Icon,
  Delete02Icon,
  Edit02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductDrawer } from "@/components/admin/product-drawer";
import { VariantDrawer } from "@/components/admin/variant-drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PRODUCT_COLORS,
  type ProductColor,
} from "@/lib/constants/product-options";
import { formatCurrency } from "@/lib/utils";
import { useCategoryStore } from "@/stores/category.store";
import { useProductStore } from "@/stores/product.store";
import type { VariantSummary } from "@/types/api";

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const { product, variants, isLoading, fetchProduct, deleteVariant } =
    useProductStore();
  const { items: categories, fetchAll: fetchCategories } = useCategoryStore();

  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [variantDrawerOpen, setVariantDrawerOpen] = useState(false);
  const [variantDrawerMode, setVariantDrawerMode] = useState<"create" | "edit">(
    "create",
  );
  const [selectedVariant, setSelectedVariant] = useState<VariantSummary | null>(
    null,
  );
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct(productId);
    fetchCategories();
  }, [productId, fetchProduct, fetchCategories]);

  const handleEditProduct = () => {
    setProductDrawerOpen(true);
  };

  const handleAddVariant = () => {
    setSelectedVariant(null);
    setVariantDrawerMode("create");
    setVariantDrawerOpen(true);
  };

  const handleEditVariant = (variant: VariantSummary) => {
    setSelectedVariant(variant);
    setVariantDrawerMode("edit");
    setVariantDrawerOpen(true);
  };

  const handleDeleteVariant = (variantId: string) => {
    setVariantToDelete(variantId);
  };

  const confirmDeleteVariant = async () => {
    if (!variantToDelete) return;

    try {
      await deleteVariant(variantToDelete);
      toast.success("Variant deleted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete variant",
      );
    } finally {
      setVariantToDelete(null);
    }
  };

  if (isLoading && !product) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">Product not found</div>
        <Button asChild variant="outline">
          <Link href="/admin/products">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 size-4" />
            Back to Products
          </Link>
        </Button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/products">
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{product.slug}</span>
              <span>•</span>
              <span className={product.isActive ? "text-green-600" : ""}>
                {product.isActive ? "Active" : "Draft"}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={handleEditProduct} className="gap-2">
          <HugeiconsIcon icon={Edit02Icon} className="size-4" />
          Edit Product
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-8 md:col-span-2">
          {/* Variants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Variants</CardTitle>
              <Button onClick={handleAddVariant} size="sm" variant="outline">
                <HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />
                Add Variant
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No variants added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>
                            <div className="relative size-10 overflow-hidden rounded-md border bg-muted">
                              {variant.images?.[0] ? (
                                <Image
                                  src={variant.images[0]}
                                  alt={`${product.name} ${variant.size} ${variant.color}`}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                                  No Img
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{variant.size}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {PRODUCT_COLORS[variant.color as ProductColor]
                                ?.hex && (
                                <div
                                  className="size-3 rounded-full border shadow-sm"
                                  style={{
                                    backgroundColor:
                                      PRODUCT_COLORS[
                                        variant.color as ProductColor
                                      ].hex,
                                  }}
                                />
                              )}
                              {variant.color}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {variant.stock}
                              {variant.stock <= 5 && (
                                <Badge
                                  variant="destructive"
                                  className="h-5 px-1.5 text-[10px]"
                                >
                                  Low
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditVariant(variant)}
                                className="size-8"
                              >
                                <HugeiconsIcon
                                  icon={Edit02Icon}
                                  className="size-4"
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteVariant(variant.id)}
                                className="size-8 text-destructive hover:text-destructive"
                              >
                                <HugeiconsIcon
                                  icon={Delete02Icon}
                                  className="size-4"
                                />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                {product.description || "No description provided."}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Price</span>
                <span className="text-xl font-bold">
                  {formatCurrency(product.price / 100)}
                </span>
              </div>
              {product.compareAtPrice && (
                <div className="flex items-baseline justify-between text-muted-foreground">
                  <span className="text-sm">Compare At</span>
                  <span className="text-sm line-through">
                    {formatCurrency(product.compareAtPrice / 100)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="font-medium">
                  {category?.name || "Uncategorized"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Material</div>
                <div className="font-medium">{product.material || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Fabric</div>
                <div className="font-medium">{product.fabric || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Fit</div>
                <div className="font-medium">{product.fit || "-"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Default Color
                </div>
                <div className="font-medium">{product.defaultColor || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Default Size
                </div>
                <div className="font-medium">{product.defaultSize || "-"}</div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                {product.isFeatured && (
                  <Badge variant="secondary" className="gap-1">
                    <HugeiconsIcon icon={Tick02Icon} className="size-3" />
                    Featured
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
            {product.thumbnailUrl ? (
              <Image
                src={product.thumbnailUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                No Thumbnail
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductDrawer
        open={productDrawerOpen}
        onOpenChange={setProductDrawerOpen}
        mode="edit"
        product={product}
      />

      <VariantDrawer
        open={variantDrawerOpen}
        onOpenChange={setVariantDrawerOpen}
        mode={variantDrawerMode}
        productId={product.id}
        variant={selectedVariant}
      />

      <AlertDialog
        open={!!variantToDelete}
        onOpenChange={(open) => !open && setVariantToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              variant from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteVariant}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
