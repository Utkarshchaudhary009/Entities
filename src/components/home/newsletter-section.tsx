"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Optimistic UI strictly managed by local state (simulating API/Zustand pending)
    setTimeout(() => {
      setIsLoading(false);
      setEmail("");
      toast.success("Subscribed to the Entities newsletter.");
    }, 10);
  };

  return (
    <section className="w-full py-24 px-4 bg-white text-black flex flex-col items-center border-t border-border/40">
      <h2 className="text-lg md:text-xl tracking-widest uppercase font-medium mb-4">
        A GOOD BRAND
      </h2>
      <p className="text-sm text-gray-500 tracking-wide mb-8 text-center max-w-md">
        Subscribe to our newsletter to receive updates on new arrivals,
        exclusive features, and editorial content.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row w-full max-w-md gap-0"
      >
        <Input
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-none border-black/20 focus-visible:ring-0 focus-visible:border-black h-12 flex-1 shadow-none"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-none h-12 px-8 bg-black hover:bg-black/90 text-white font-medium tracking-wide uppercase text-xs active:scale-[0.98] transition-all"
        >
          {isLoading ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="w-4 h-4 animate-spin"
            />
          ) : (
            "SUBSCRIBE"
          )}
        </Button>
      </form>
    </section>
  );
}
