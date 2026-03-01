"use client";

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
import {
  PRODUCT_COLORS,
  PRODUCT_SIZES,
  VALID_COLORS,
  VALID_SIZES,
} from "@/lib/constants/product-options";
import { cn } from "@/lib/utils";
import { createVariantSchema } from "@/lib/validations/product";
import { useProductStore } from "@/stores/product.store";
import type { VariantSummary } from "@/types/api";

interface VariantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  productId: string;
  variant?: VariantSummary | null;
}

interface FormState {
  size: string;
  color: string;
  images: string[];
  stock: number;
  sku: string;
  isActive: boolean;
}

const initialFormState: FormState = {
  size: "",
  color: "",
  images: [],
  stock: 0,
  sku: "",
  isActive: true,
};

export function VariantDrawer({
  open,
  onOpenChange,
  mode,
  productId,
  variant,
}: VariantDrawerProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createVariant, updateVariant } = useProductStore();

  useEffect(() => {
    if (open && mode === "edit" && variant) {
      setForm({
        size: variant.size,
        color: variant.color,
        images: variant.images,
        stock: variant.stock,
        sku: variant.sku ?? "",
        isActive: variant.isActive,
      });
      setErrors({});
    } else if (open && mode === "create") {
      setForm(initialFormState);
      setErrors({});
    }
  }, [open, mode, variant]);

  const handleSubmit = async () => {
    setErrors({});

    const payload = {
      productId,
      size: form.size,
      color: form.color,
      images: form.images,
      stock: form.stock,
      sku: form.sku || undefined,
      isActive: form.isActive,
    };

    const result = createVariantSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix validation errors");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createVariant(result.data);
        toast.success("Variant created successfully");
      } else if (variant) {
        await updateVariant(variant.id, result.data);
        toast.success("Variant updated successfully");
      }
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Operation failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {mode === "create" ? "Create Variant" : "Edit Variant"}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "create"
              ? "Add a new product variant with size, color, and stock"
              : "Update the variant details"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4 space-y-4 max-h-[60vh]">
          <div className="space-y-2">
            <Label htmlFor="size">Size *</Label>
            <Select
              value={form.size}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, size: value }))
              }
            >
              <SelectTrigger
                className={cn("w-full", errors.size && "border-destructive")}
              >
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {VALID_SIZES.map((sizeKey) => (
                  <SelectItem key={sizeKey} value={sizeKey}>
                    {PRODUCT_SIZES[sizeKey].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.size && (
              <p className="text-xs text-destructive">{errors.size}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <Select
              value={form.color}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, color: value }))
              }
            >
              <SelectTrigger
                className={cn("w-full", errors.color && "border-destructive")}
              >
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {VALID_COLORS.map((colorKey) => {
                  const colorConfig = PRODUCT_COLORS[colorKey];
                  return (
                    <SelectItem key={colorKey} value={colorKey}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full border shadow-sm"
                          style={{ backgroundColor: colorConfig.hex }}
                        />
                        {colorKey}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.color && (
              <p className="text-xs text-destructive">{errors.color}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  stock: Number.parseInt(e.target.value, 10) || 0,
                }))
              }
              className={cn(errors.stock && "border-destructive")}
            />
            {errors.stock && (
              <p className="text-xs text-destructive">{errors.stock}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              type="text"
              placeholder="Optional SKU"
              value={form.sku}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sku: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <ImageUpload
              value={form.images}
              onChange={(urls) =>
                setForm((prev) => ({ ...prev, images: urls }))
              }
              bucket="variants"
              maxImages={10}
            />
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="active:scale-95 transition-transform"
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
                ? "Create Variant"
                : "Update Variant"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
