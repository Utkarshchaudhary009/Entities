"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserAddress } from "@/generated/prisma/client";
import { addressSchema } from "@/lib/validations/user-profile";

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialData?: UserAddress;
  onSubmit: (data: AddressFormValues) => void;
  isLoading?: boolean;
}

export function AddressForm({
  initialData,
  onSubmit,
  isLoading,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData
      ? {
          label: initialData.label,
          name: initialData.name,
          phone: initialData.phone,
          address: initialData.address,
          city: initialData.city,
          state: initialData.state,
          pincode: initialData.pincode,
          isDefault: initialData.isDefault,
        }
      : {
          label: "Home",
          isDefault: false,
        },
  });

  const isDefault = watch("isDefault");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Address Label (Home, Work, etc.)</Label>
        <Input id="label" {...register("label")} placeholder="e.g. Home" />
        {errors.label && (
          <p className="text-xs text-destructive">{errors.label.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" {...register("name")} placeholder="John Doe" />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="10-digit number"
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Street Address</Label>
        <Textarea
          id="address"
          {...register("address")}
          placeholder="House/Flat No., Building Name, Street"
          rows={3}
        />
        {errors.address && (
          <p className="text-xs text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} placeholder="City" />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...register("state")} placeholder="State" />
          {errors.state && (
            <p className="text-xs text-destructive">{errors.state.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pincode">Pincode</Label>
        <Input id="pincode" {...register("pincode")} placeholder="6 digits" />
        {errors.pincode && (
          <p className="text-xs text-destructive">{errors.pincode.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isDefault"
          checked={isDefault}
          onCheckedChange={(checked: boolean | "indeterminate") =>
            setValue("isDefault", checked === true)
          }
        />
        <Label htmlFor="isDefault" className="font-normal cursor-pointer">
          Set as default address
        </Label>
      </div>

      <Button type="submit" className="w-full mt-4" disabled={isLoading}>
        {isLoading
          ? "Saving..."
          : initialData
            ? "Update Address"
            : "Add Address"}
      </Button>
    </form>
  );
}
