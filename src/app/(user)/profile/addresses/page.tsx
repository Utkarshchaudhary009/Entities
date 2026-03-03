"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { AddressCard } from "@/components/profile/address-card";
import { AddressForm } from "@/components/profile/address-form";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { addressSchema } from "@/lib/validations/user-profile";
import { useUserAddressStore } from "@/stores/user-address.store";

type AddressFormValues = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const {
    addresses,
    isLoading,
    isAdding,
    updatingId,
    deletingId,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
  } = useUserAddressStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleOpenAdd = () => {
    setEditingAddressId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setEditingAddressId(id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: AddressFormValues) => {
    if (editingAddressId) {
      await updateAddress(editingAddressId, data);
    } else {
      await addAddress({
        ...data,
        isDefault: data.isDefault ?? false,
      });
    }
    setIsDialogOpen(false);
  };

  const editingAddress = addresses.find((a) => a.id === editingAddressId);

  return (
    <div className="flex flex-col h-full bg-card min-h-[500px]">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <BackButton fallbackHref="/profile" />
          <h2 className="text-lg font-semibold">Saved Addresses</h2>
        </div>
        <Button size="sm" onClick={handleOpenAdd} className="gap-2">
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Add New
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {isLoading && addresses.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No addresses found.</p>
            <p className="text-sm">Add one to speed up checkout.</p>
          </div>
        ) : (
          addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => handleOpenEdit(address.id)}
              onDelete={() => deleteAddress(address.id)}
              onSetDefault={() => setDefault(address.id)}
              isDeleting={deletingId === address.id}
            />
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddressId ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <AddressForm
            initialData={editingAddress}
            onSubmit={handleSubmit}
            isLoading={isAdding || updatingId === editingAddressId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
