"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackHref?: string;
  className?: string;
}

/**
 * Smart back button that uses browser history when available,
 * falls back to specified href if no history exists.
 */
export function BackButton({
  fallbackHref = "/",
  className = "-ml-2 mr-2",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className={className}
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
    </Button>
  );
}
