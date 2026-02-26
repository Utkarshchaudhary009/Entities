"use client";

import { useClerk } from "@clerk/nextjs";
import {
  CustomerSupportIcon,
  DocumentCodeIcon,
  Location01Icon,
  Logout01Icon,
  Moon02Icon,
  Notification01Icon,
  PackageIcon,
  Sun01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileMenuItem } from "@/components/profile/profile-menu-item";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();

  return (
    <div className="flex flex-col h-full">
      <ProfileHero />

      <div className="p-4 border-b flex justify-between items-center bg-card">
        <div className="flex items-center gap-3">
          <HugeiconsIcon
            icon={theme === "dark" ? Moon02Icon : Sun01Icon}
            className="size-5 text-muted-foreground"
          />
          <span className="text-sm font-medium">Dark Mode</span>
        </div>
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        />
      </div>

      <div className="flex flex-col bg-card">
        <ProfileMenuItem
          href="/profile/orders"
          icon={PackageIcon}
          label="My Orders"
        />
        <ProfileMenuItem
          href="/profile/coupons"
          icon={Ticket01Icon}
          label="My Coupons"
        />
        <ProfileMenuItem
          href="/profile/addresses"
          icon={Location01Icon}
          label="Addresses"
        />
        <ProfileMenuItem
          href="/profile/notifications"
          icon={Notification01Icon}
          label="Notifications"
        />
        <ProfileMenuItem
          href="/profile/legal"
          icon={DocumentCodeIcon}
          label="Legal & Policies"
        />
        <ProfileMenuItem
          href="/profile/support"
          icon={CustomerSupportIcon}
          label="Help & Support"
        />
      </div>

      <div className="p-6 mt-4">
        <Button
          variant="destructive"
          className="w-full justify-start gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <HugeiconsIcon icon={Logout01Icon} className="size-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
