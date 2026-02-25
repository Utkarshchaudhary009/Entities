"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { ProductAttributes } from "@/components/admin/product/product-attributes";
// Sub-components
import { ProductBasicInfo } from "@/components/admin/product/product-basic-info";
import { ProductPricing } from "@/components/admin/product/product-pricing";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createProductSchema } from "@/lib/validations/product";
import { useCategoryStore } from "@/stores/category.store";
import { useProductStore } from "@/stores/product.store";
import type { ApiProduct } from "@/types/api";

interface ProductDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  product?: ApiProduct | null;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  thumbnailUrl: string;
  material: string;
  fabric: string;
  fit: string;
  careInstruction: string;
  defaultColor: string;
  defaultSize: string;
  isFeatured: boolean;
  isActive: boolean;
}

const initialFormState: FormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  categoryId: "",
  thumbnailUrl: "",
  material: "",
  fabric: "",
  fit: "",
  careInstruction: "",
  defaultColor: "",
  defaultSize: "",
  isFeatured: false,
  isActive: true,
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductDrawer({
  open,
  onOpenChange,
  mode,
  product,
}: ProductDrawerProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createProduct, updateProduct } = useProductStore();
  const { items: categories, fetchAll: fetchCategories } = useCategoryStore();

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, fetchCategories]);

  useEffect(() => {
    if (!open) return;

    // Combine state updates
    if (mode === "edit" && product) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        price: product.price.toString(),
        compareAtPrice: product.compareAtPrice?.toString() ?? "",
        categoryId: product.categoryId ?? "",
        thumbnailUrl: product.thumbnailUrl ?? "",
        material: product.material ?? "",
        fabric: product.fabric ?? "",
        fit: product.fit ?? "",
        careInstruction: product.careInstruction ?? "",
        defaultColor: product.defaultColor ?? "",
        defaultSize: product.defaultSize ?? "",
        isFeatured: product.isFeatured,
        isActive: product.isActive,
      });
    } else {
      setForm(initialFormState);
    }
    setErrors({});
  }, [open, mode, product]); // Intentionally omitting setForm and setErrors from dependencies

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && typeof value === "string") {
        updated.slug = generateSlug(value);
      }
      return updated;
    });

    // Only update errors if we have one for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit() {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice
        ? Number(form.compareAtPrice)
        : undefined,
      categoryId: form.categoryId || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      material: form.material || undefined,
      fabric: form.fabric || undefined,
      fit: form.fit || undefined,
      careInstruction: form.careInstruction || undefined,
      defaultColor: form.defaultColor || undefined,
      defaultSize: form.defaultSize || undefined,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    const result = createProductSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0]?.toString();
        if (path) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createProduct(result.data);
        toast.success("Product created successfully");
      } else if (product) {
        await updateProduct(product.id, result.data);
        toast.success("Product updated successfully");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save product",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="h-full max-w-md mx-auto">
        <DrawerHeader>
          <DrawerTitle>
            {mode === "create" ? "Create Product" : "Edit Product"}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "create"
              ? "Add a new product to your catalog"
              : "Update product details"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4">
            <ProductBasicInfo
              name={form.name}
              slug={form.slug}
              description={form.description}
              errors={errors}
              onChange={handleChange}
            />

            <ProductPricing
              price={form.price}
              compareAtPrice={form.compareAtPrice}
              categoryId={form.categoryId}
              categories={categories}
              errors={errors}
              onChange={handleChange}
            />

            <div className="space-y-1.5">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <ImageUpload
                value={form.thumbnailUrl ? [form.thumbnailUrl] : []}
                onChange={(urls) => handleChange("thumbnailUrl", urls[0] || "")}
                bucket="products"
                maxImages={1}
                className="w-full"
              />
              {errors.thumbnailUrl && (
                <p className="text-destructive text-xs">
                  {errors.thumbnailUrl}
                </p>
              )}
            </div>

            <ProductAttributes
              material={form.material}
              fabric={form.fabric}
              fit={form.fit}
              careInstruction={form.careInstruction}
              defaultColor={form.defaultColor}
              defaultSize={form.defaultSize}
              isFeatured={form.isFeatured}
              isActive={form.isActive}
              onChange={handleChange}
            />
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </DrawerClose>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn("flex-1", isSubmitting && "cursor-not-allowed")}
          >
            {isSubmitting && (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="mr-1.5 size-4 animate-spin"
              />
            )}
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
