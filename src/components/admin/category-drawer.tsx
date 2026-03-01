"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Drawer } from "vaul";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createCategorySchema } from "@/lib/validations/category";
import { useCategoryStore } from "@/stores/category.store";
import type { ApiCategory } from "@/types/api";

type CategoryFormValues = z.input<typeof createCategorySchema>;

interface CategoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // If editing, pass the ID. If creating, pass undefined.
  editingId?: string;
}

export function CategoryDrawer({
  open,
  onOpenChange,
  editingId,
}: CategoryDrawerProps) {
  const isEditing = !!editingId;
  const { items: categories, create, update, isLoading } = useCategoryStore();
  const isAdding = isLoading; // fallback
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  // Find existing category if editing
  const existingCategory = isEditing
    ? categories?.find((c: ApiCategory) => c.id === editingId)
    : undefined;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      thumbnailUrl: "",
      about: "",
      discountPercent: 0,
      sortOrder: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  // Reset form when drawer opens/closes or edit changes
  useEffect(() => {
    if (open) {
      if (existingCategory) {
        reset({
          name: existingCategory.name,
          slug: existingCategory.slug,
          thumbnailUrl: existingCategory.thumbnailUrl || "",
          about: existingCategory.about || "",
          discountPercent: existingCategory.discountPercent,
          sortOrder: existingCategory.sortOrder,
          isActive: existingCategory.isActive,
        });
      } else {
        reset({
          name: "",
          slug: "",
          thumbnailUrl: "",
          about: "",
          discountPercent: 0,
          sortOrder: 0,
          isActive: true,
        });
      }
    }
  }, [open, existingCategory, reset]);

  // Auto-generate slug from name if empty and not manually edited
  const watchedName = watch("name");
  useEffect(() => {
    if (!isEditing && watchedName && !dirtyFields.slug) {
      const generatedSlug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [watchedName, isEditing, setValue, dirtyFields.slug]);

  const onSubmit = async (data: CategoryFormValues) => {
    const values = createCategorySchema.parse(data);
    setIsSubmittingLocal(true);
    try {
      if (isEditing && editingId) {
        await update(editingId, values);
        toast.success("Category updated successfully");
      } else {
        await create(values);
        toast.success("Category created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update category"
            : "Failed to create category",
      );
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const isSaving = isSubmittingLocal || isAdding;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
      shouldScaleBackground
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto max-h-[90vh] flex-col rounded-t-[10px] bg-background border border-border outline-none">
          <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/20" />

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:mx-auto lg:w-full lg:max-w-2xl">
            <Drawer.Title className="mb-4 text-xl font-bold tracking-tight">
              {isEditing ? "Edit Category" : "Create Category"}
            </Drawer.Title>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Summer Collection"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="e.g. summer-collection"
                    {...register("slug")}
                  />
                  {errors.slug && (
                    <p className="text-xs text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  placeholder="https://example.com/image.jpg"
                  {...register("thumbnailUrl")}
                />
                {errors.thumbnailUrl && (
                  <p className="text-xs text-destructive">
                    {errors.thumbnailUrl.message}
                  </p>
                )}
                {watch("thumbnailUrl") && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <span className="truncate max-w-[200px] inline-block align-bottom">
                      {watch("thumbnailUrl")}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About (Optional)</Label>
                <Textarea
                  id="about"
                  placeholder="Short description of this category..."
                  {...register("about")}
                  className="resize-none h-24"
                />
                {errors.about && (
                  <p className="text-xs text-destructive">
                    {errors.about.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Discount %</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    {...register("discountPercent", { valueAsNumber: true })}
                  />
                  {errors.discountPercent && (
                    <p className="text-xs text-destructive">
                      {errors.discountPercent.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    {...register("sortOrder", { valueAsNumber: true })}
                  />
                  {errors.sortOrder && (
                    <p className="text-xs text-destructive">
                      {errors.sortOrder.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive categories will be hidden from the storefront.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setValue("isActive", checked, { shouldValidate: true })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex-1 gap-2"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full flex-1 gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="size-4"
                    />
                  )}
                  {isSaving
                    ? "Saving..."
                    : isEditing
                      ? "Save Changes"
                      : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
