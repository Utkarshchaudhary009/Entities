"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  }, [open, mode, product]);

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && typeof value === "string") {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
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
      price: Number.parseInt(form.price, 10) || 0,
      compareAtPrice: form.compareAtPrice
        ? Number.parseInt(form.compareAtPrice, 10)
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
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full max-w-md">
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
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Product name"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="product-slug"
                aria-invalid={!!errors.slug}
              />
              {errors.slug && (
                <p className="text-destructive text-xs">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (cents) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="1000"
                  aria-invalid={!!errors.price}
                />
                {errors.price && (
                  <p className="text-destructive text-xs">{errors.price}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="compareAtPrice">Compare At Price</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  value={form.compareAtPrice}
                  onChange={(e) =>
                    handleChange("compareAtPrice", e.target.value)
                  }
                  placeholder="1500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => handleChange("categoryId", value)}
              >
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-destructive text-xs">{errors.categoryId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <ImageUpload
                value={form.thumbnailUrl ? [form.thumbnailUrl] : []}
                onChange={(urls) => handleChange("thumbnailUrl", urls[0] || "")}
                maxImages={1}
                className="w-full"
              />
              {errors.thumbnailUrl && (
                <p className="text-destructive text-xs">
                  {errors.thumbnailUrl}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={form.material}
                  onChange={(e) => handleChange("material", e.target.value)}
                  placeholder="Cotton"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fabric">Fabric</Label>
                <Input
                  id="fabric"
                  value={form.fabric}
                  onChange={(e) => handleChange("fabric", e.target.value)}
                  placeholder="Denim"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fit">Fit</Label>
                <Input
                  id="fit"
                  value={form.fit}
                  onChange={(e) => handleChange("fit", e.target.value)}
                  placeholder="Regular"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="careInstruction">Care Instruction</Label>
                <Input
                  id="careInstruction"
                  value={form.careInstruction}
                  onChange={(e) =>
                    handleChange("careInstruction", e.target.value)
                  }
                  placeholder="Machine wash"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="defaultColor">Default Color</Label>
                <Input
                  id="defaultColor"
                  value={form.defaultColor}
                  onChange={(e) => handleChange("defaultColor", e.target.value)}
                  placeholder="Black"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="defaultSize">Default Size</Label>
                <Input
                  id="defaultSize"
                  value={form.defaultSize}
                  onChange={(e) => handleChange("defaultSize", e.target.value)}
                  placeholder="M"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="isFeatured" className="cursor-pointer">
                Featured Product
              </Label>
              <Switch
                id="isFeatured"
                checked={form.isFeatured}
                onCheckedChange={(checked) =>
                  handleChange("isFeatured", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => handleChange("isActive", checked)}
              />
            </div>
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
