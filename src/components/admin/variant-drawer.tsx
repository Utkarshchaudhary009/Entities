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
import { cn } from "@/lib/utils";
import { createVariantSchema } from "@/lib/validations/product";
import { useColorStore } from "@/stores/color.store";
import { useProductStore } from "@/stores/product.store";
import { useSizeStore } from "@/stores/size.store";
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
  colorHex: string;
  images: string[];
  stock: number;
  sku: string;
  isActive: boolean;
}

const initialFormState: FormState = {
  size: "",
  color: "",
  colorHex: "",
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

  const {
    items: sizes,
    fetchAll: fetchSizes,
    isLoading: sizesLoading,
  } = useSizeStore();
  const {
    items: colors,
    fetchAll: fetchColors,
    isLoading: colorsLoading,
  } = useColorStore();
  const { createVariant, updateVariant } = useProductStore();

  useEffect(() => {
    if (open) {
      fetchSizes();
      fetchColors();
    }
  }, [open, fetchSizes, fetchColors]);

  useEffect(() => {
    if (open && mode === "edit" && variant) {
      setForm({
        size: variant.size,
        color: variant.color,
        colorHex: variant.colorHex ?? "",
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

  const handleColorChange = (colorName: string) => {
    const selectedColor = colors.find((c) => c.name === colorName);
    setForm((prev) => ({
      ...prev,
      color: colorName,
      colorHex: selectedColor?.hex ?? "",
    }));
  };

  const handleSubmit = async () => {
    setErrors({});

    const payload = {
      productId,
      size: form.size,
      color: form.color,
      colorHex: form.colorHex || undefined,
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
    <Drawer open={open} onOpenChange={onOpenChange}>
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
              disabled={sizesLoading}
            >
              <SelectTrigger
                className={cn("w-full", errors.size && "border-destructive")}
              >
                <SelectValue
                  placeholder={sizesLoading ? "Loading..." : "Select size"}
                />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size.id} value={size.label}>
                    {size.label}
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
              onValueChange={handleColorChange}
              disabled={colorsLoading}
            >
              <SelectTrigger
                className={cn("w-full", errors.color && "border-destructive")}
              >
                <SelectValue
                  placeholder={colorsLoading ? "Loading..." : "Select color"}
                />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.id} value={color.name}>
                    <span className="flex items-center gap-2">
                      {color.hex && (
                        <span
                          className="size-3 rounded-full border"
                          style={{ backgroundColor: color.hex }}
                        />
                      )}
                      {color.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.color && (
              <p className="text-xs text-destructive">{errors.color}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorHex">Color Hex</Label>
            <Input
              id="colorHex"
              type="text"
              placeholder="#FFFFFF"
              value={form.colorHex}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, colorHex: e.target.value }))
              }
            />
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
