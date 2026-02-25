"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
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
import { createColorSchema } from "@/lib/validations/color";
import { useColorStore } from "@/stores/color.store";
import type { ApiColor } from "@/types/api";

type ColorFormValues = z.infer<typeof createColorSchema>;

interface ColorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: string;
}

export function ColorDrawer({
  open,
  onOpenChange,
  editingId,
}: ColorDrawerProps) {
  const isEditing = !!editingId;
  const {
    items: colors,
    create,
    update,
    delete: remove,
    isLoading,
  } = useColorStore();
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);

  const existingColor = isEditing
    ? colors.find((c: ApiColor) => c.id === editingId)
    : undefined;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ColorFormValues>({
    resolver: zodResolver(createColorSchema),
    defaultValues: {
      name: "",
      hex: "#000000",
      sortOrder: 0,
    },
  });

  const hexValue = watch("hex");

  useEffect(() => {
    if (!open) return;
    if (existingColor) {
      reset({
        name: existingColor.name,
        hex: existingColor.hex,
        sortOrder: existingColor.sortOrder ?? 0,
      });
    } else {
      reset({ name: "", hex: "#000000", sortOrder: 0 });
    }
  }, [open, existingColor, reset]);

  const onSubmit = async (data: ColorFormValues) => {
    setIsSubmittingLocal(true);
    try {
      if (isEditing && editingId) {
        await update(editingId, data);
        toast.success("Color updated successfully");
      } else {
        await create(data);
        toast.success("Color created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Color save failed", error);
      toast.error(
        isEditing ? "Failed to update color" : "Failed to create color",
      );
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setIsDeletingLocal(true);
    try {
      await remove(editingId);
      toast.success("Color deleted");
      onOpenChange(false);
    } catch (error) {
      console.error("Color delete failed", error);
      toast.error("Failed to delete color");
    } finally {
      setIsDeletingLocal(false);
    }
  };

  const isSaving = isSubmittingLocal || isLoading;
  const isDeleting = isDeletingLocal;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
      shouldScaleBackground
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto max-h-[90vh] flex-col rounded-t-[10px] border border-border bg-background outline-none">
          <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/20" />

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:mx-auto lg:w-full lg:max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Drawer.Title className="text-xl font-bold tracking-tight">
                {isEditing ? "Edit Color" : "Create Color"}
              </Drawer.Title>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                >
                  {isDeleting ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  )}
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
              <div className="space-y-2">
                <Label htmlFor="name">Color Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Midnight Black"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Hex picker + text input synced */}
              <div className="space-y-2">
                <Label htmlFor="hex">Hex Color</Label>
                <div className="flex items-center gap-3">
                  {/* Native color picker swatch */}
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border shadow-sm">
                    <input
                      type="color"
                      value={hexValue || "#000000"}
                      onChange={(e) =>
                        setValue("hex", e.target.value, {
                          shouldValidate: true,
                        })
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer border-0 bg-transparent p-0 opacity-0"
                      aria-label="Pick a color"
                    />
                    <div
                      className="size-full rounded-md transition-colors"
                      style={{ backgroundColor: hexValue || "#000000" }}
                    />
                  </div>
                  {/* Text input stays in sync */}
                  <Input
                    id="hex"
                    placeholder="#000000"
                    {...register("hex")}
                    onChange={(e) =>
                      setValue("hex", e.target.value, { shouldValidate: true })
                    }
                    className="font-mono uppercase"
                  />
                </div>
                {errors.hex && (
                  <p className="text-xs text-destructive">
                    {errors.hex.message}
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
              </div>

              <div className="flex gap-3 border-t border-border pt-4">
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
