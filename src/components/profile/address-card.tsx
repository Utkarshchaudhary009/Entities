"use client";

import {
  Delete01Icon,
  Edit01Icon,
  MoreVerticalIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserAddress } from "@/generated/prisma/client";

interface AddressCardProps {
  address: UserAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isDeleting?: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting,
}: AddressCardProps) {
  return (
    <div
      className={`p-4 border rounded-xl bg-card relative ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase text-[10px]">
            {address.label}
          </Badge>
          {address.isDefault && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              Default
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
              <HugeiconsIcon
                icon={MoreVerticalIcon}
                className="size-4 text-muted-foreground"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <HugeiconsIcon icon={Edit01Icon} className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {!address.isDefault && (
              <DropdownMenuItem onClick={onSetDefault}>
                <HugeiconsIcon icon={StarIcon} className="size-4 mr-2" />
                Set as Default
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <HugeiconsIcon icon={Delete01Icon} className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">{address.name}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {address.address}
          <br />
          {address.city}, {address.state} {address.pincode}
        </p>
        <p className="text-sm font-medium pt-1">{address.phone}</p>
      </div>
    </div>
  );
}
