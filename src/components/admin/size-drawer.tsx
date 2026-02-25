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
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSizeStore } from "@/stores/size.store";
import type { ApiSize } from "@/types/api";

const sizeFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  sortOrder: z.number().int().optional(),
  measurements: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || !val.trim()) return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    }, "Invalid JSON"),
});

type SizeFormValues = z.infer<typeof sizeFormSchema>;

interface SizeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: string;
}

export function SizeDrawer({ open, onOpenChange, editingId }: SizeDrawerProps) {
  const isEditing = !!editingId;
  const {
    items: sizes,
    create,
    update,
    delete: remove,
    isLoading,
  } = useSizeStore();
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);

  const existingSize = isEditing
    ? sizes.find((s: ApiSize) => s.id === editingId)
    : undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SizeFormValues>({
    resolver: zodResolver(sizeFormSchema),
    defaultValues: {
      label: "",
      sortOrder: 0,
      measurements: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (existingSize) {
      reset({
        label: existingSize.label,
        sortOrder: existingSize.sortOrder,
        measurements:
          existingSize.measurements &&
          Object.keys(existingSize.measurements as Record<string, unknown>)
            .length > 0
            ? JSON.stringify(existingSize.measurements, null, 2)
            : "",
      });
    } else {
      reset({
        label: "",
        sortOrder: 0,
        measurements: "",
      });
    }
  }, [open, existingSize, reset]);

  const onSubmit = async (data: SizeFormValues) => {
    setIsSubmittingLocal(true);
    try {
      const payload = {
        label: data.label,
        sortOrder: data.sortOrder,
        measurements: data.measurements?.trim()
          ? JSON.parse(data.measurements)
          : undefined,
      };

      if (isEditing && editingId) {
        await update(editingId, payload);
        toast.success("Size updated successfully");
      } else {
        await create(payload);
        toast.success("Size created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Size save failed", error);
      toast.error(
        isEditing ? "Failed to update size" : "Failed to create size",
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
      toast.success("Size deleted");
      onOpenChange(false);
    } catch (error) {
      console.error("Size delete failed", error);
      toast.error("Failed to delete size");
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
                {isEditing ? "Edit Size" : "Create Size"}
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    placeholder="e.g. XL, 42, 10.5"
                    {...register("label")}
                  />
                  {errors.label && (
                    <p className="text-xs text-destructive">
                      {errors.label.message}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurements">Measurements (JSON)</Label>
                <Textarea
                  id="measurements"
                  placeholder='{"chest": "44", "length": "28"}'
                  className="h-32 font-mono text-sm"
                  {...register("measurements")}
                />
                {errors.measurements ? (
                  <p className="text-xs text-destructive">
                    {errors.measurements.message}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Enter valid JSON for custom dimensions.
                  </p>
                )}
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
