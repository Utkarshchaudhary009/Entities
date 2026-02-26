"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

const POLICIES = [
  { title: "Terms and Conditions", href: "/policies/terms" },
  { title: "Privacy Policy", href: "/policies/privacy" },
  { title: "Shipping Policy", href: "/policies/shipping" },
  { title: "Return & Refund Policy", href: "/policies/returns" },
];

export default function LegalPage() {
  return (
    <div className="flex flex-col h-full bg-card min-h-[500px]">
      <div className="flex items-center p-4 border-b">
        <BackButton fallbackHref="/profile" />
        <h2 className="text-lg font-semibold">Legal & Policies</h2>
      </div>

      <div className="flex flex-col">
        {POLICIES.map((policy) => (
          <Link
            key={policy.href}
            href={policy.href}
            className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium text-sm">{policy.title}</span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 text-muted-foreground"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
