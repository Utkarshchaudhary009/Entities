"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Drawer } from "vaul";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { createDiscountSchema } from "@/lib/validations/discount";
import { useDiscountStore } from "@/stores/discount.store";
import type { ApiDiscount } from "@/types/api";
import { DISCOUNT_TYPE_LABELS, DISCOUNT_TYPES } from "@/types/domain";

type DiscountFormValues = z.input<typeof createDiscountSchema>;

interface DiscountDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: string;
}

const defaultValues: DiscountFormValues = {
  code: "",
  description: undefined,
  discountType: "PERCENTAGE",
  value: 0,
  minOrderValue: 0,
  maxDiscount: undefined,
  usageLimit: undefined,
  isActive: true,
  startsAt: null,
  expiresAt: null,
};

export function DiscountDrawer({
  open,
  onOpenChange,
  editingId,
}: DiscountDrawerProps) {
  const isEditing = !!editingId;
  const {
    items: discounts,
    create,
    update,
    delete: remove,
    isLoading,
  } = useDiscountStore();
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);

  const existingDiscount = isEditing
    ? discounts.find((d: ApiDiscount) => d.id === editingId)
    : undefined;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    resolver: async (data, context, options) => {
      const formData = { ...data };
      if (formData.startsAt && formData.startsAt.length === 16) {
        formData.startsAt = new Date(formData.startsAt).toISOString();
      }
      if (formData.expiresAt && formData.expiresAt.length === 16) {
        formData.expiresAt = new Date(formData.expiresAt).toISOString();
      }
      return zodResolver(createDiscountSchema)(formData, context, options);
    },
    defaultValues,
  });

  const isActive = watch("isActive");
  const discountType = watch("discountType");

  useEffect(() => {
    if (!open) return;
    if (existingDiscount) {
      reset({
        code: existingDiscount.code,
        description: existingDiscount.description ?? undefined,
        discountType: existingDiscount.discountType,
        value: existingDiscount.value,
        minOrderValue: existingDiscount.minOrderValue,
        maxDiscount: existingDiscount.maxDiscount ?? undefined,
        usageLimit: existingDiscount.usageLimit ?? undefined,
        isActive: existingDiscount.isActive,
        startsAt: existingDiscount.startsAt
          ? format(new Date(existingDiscount.startsAt), "yyyy-MM-dd'T'HH:mm")
          : null,
        expiresAt: existingDiscount.expiresAt
          ? format(new Date(existingDiscount.expiresAt), "yyyy-MM-dd'T'HH:mm")
          : null,
      });
    } else {
      reset(defaultValues);
    }
  }, [open, existingDiscount, reset]);

  const onSubmit = async (data: DiscountFormValues) => {
    const values = createDiscountSchema.parse(data);
    setIsSubmittingLocal(true);
    try {
      if (isEditing && editingId) {
        await update(editingId, values);
        toast.success("Discount updated successfully");
      } else {
        await create(values);
        toast.success("Discount created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Discount save failed", error);
      toast.error(
        isEditing ? "Failed to update discount" : "Failed to create discount",
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
      toast.success("Discount deleted");
      onOpenChange(false);
    } catch (error) {
      console.error("Discount delete failed", error);
      toast.error("Failed to delete discount");
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
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto max-h-[92vh] flex-col rounded-t-[10px] border border-border bg-background outline-none">
          <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/20" />

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:mx-auto lg:w-full lg:max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Drawer.Title className="text-xl font-bold tracking-tight">
                {isEditing ? "Edit Discount" : "Create Discount"}
              </Drawer.Title>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  title="Delete discount"
                >
                  {isDeleting ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  )}
                  <span className="sr-only">Delete discount</span>
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-8">
              {/* Code + Type */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g. SUMMER20"
                    {...register("code")}
                    className="uppercase"
                  />
                  {errors.code && (
                    <p className="text-xs text-destructive">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountType">Type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(val) =>
                      setValue("discountType", val, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="discountType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCOUNT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {DISCOUNT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.discountType && (
                    <p className="text-xs text-destructive">
                      {errors.discountType.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Short note about this discount..."
                  {...register("description")}
                  className="h-20 resize-none"
                />
              </div>

              {/* Value + Min Order + Max Discount */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Value{" "}
                    <span className="text-muted-foreground text-xs">
                      {discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
                    </span>
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    step={discountType === "PERCENTAGE" ? "0.01" : "1"}
                    {...register("value", { valueAsNumber: true })}
                  />
                  {errors.value && (
                    <p className="text-xs text-destructive">
                      {errors.value.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minOrderValue">Min Order (₹)</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    min="0"
                    {...register("minOrderValue", { valueAsNumber: true })}
                  />
                  {errors.minOrderValue && (
                    <p className="text-xs text-destructive">
                      {errors.minOrderValue.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    {...register("maxDiscount", {
                      setValueAs: (v) => {
                        if (v === "" || v == null) return undefined;
                        const n = Number(v);
                        return Number.isNaN(n) ? undefined : n;
                      },
                    })}
                  />
                </div>
              </div>

              {/* Usage Limit + Dates */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    {...register("usageLimit", {
                      setValueAs: (v) => {
                        if (v === "" || v == null) return undefined;
                        const n = Number(v);
                        return Number.isNaN(n) ? undefined : n;
                      },
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startsAt">Starts At</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    {...register("startsAt")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    {...register("expiresAt")}
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive discounts cannot be applied at checkout.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setValue("isActive", checked, { shouldValidate: true })
                  }
                />
              </div>

              {/* Actions */}
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
