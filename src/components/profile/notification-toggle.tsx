"use client";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

interface NotificationToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isLoading?: boolean;
}

export function NotificationToggle({
  id,
  label,
  description,
  checked,
  onChange,
  isLoading,
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="space-y-1 pr-6">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-11 rounded-full" />
      ) : (
        <Switch id={id} checked={checked} onCheckedChange={onChange} />
      )}
    </div>
  );
}
