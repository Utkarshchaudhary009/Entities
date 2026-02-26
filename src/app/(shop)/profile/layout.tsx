import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-3xl mx-auto md:p-6">
      <div className="md:hidden flex items-center p-4 border-b bg-background sticky top-16 z-40">
        <Button variant="ghost" size="icon" asChild className="-ml-2 mr-2">
          <Link href="/">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Profile</h1>
      </div>
      <div className="bg-background md:bg-card md:border md:rounded-2xl overflow-hidden md:shadow-sm">
        {children}
      </div>
    </div>
  );
}
