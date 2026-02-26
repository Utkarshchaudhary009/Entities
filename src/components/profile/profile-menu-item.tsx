import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProfileMenuItemProps {
  href: string;
  // biome-ignore lint/suspicious/noExplicitAny: HugeiconsIcon type is complex
  icon?: any;
  label: string;
  className?: string;
}

export function ProfileMenuItem({
  href,
  icon,
  label,
  className,
}: ProfileMenuItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between p-4 transition-colors hover:bg-muted/50 active:bg-muted border-b last:border-0",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <HugeiconsIcon icon={icon} className="size-5 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="size-4 text-muted-foreground"
      />
    </Link>
  );
}
