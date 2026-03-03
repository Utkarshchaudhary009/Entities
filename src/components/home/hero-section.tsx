import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import type { Brand } from "@/generated/prisma/client";

export function HeroSection({ brand }: { brand: Brand | null }) {
  const heroImage = brand?.heroImageUrl;

  return (
    <section className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Background Image / Collage placeholder if no image */}
      {heroImage ? (
        <Image
          src={heroImage}
          alt={brand?.name || "Entities Hero"}
          fill
          priority
          className="object-cover opacity-60"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-muted/20" />
      )}

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center text-white pt-24">
        {/* Brand Wordmark */}
        <h1 className="text-5xl md:text-7xl lg:text-[140px] tracking-[0.2em] font-light uppercase opacity-90 mb-8 mix-blend-overlay">
          ENTITIES
        </h1>

        <p className="text-sm md:text-base font-medium tracking-wide max-w-sm mb-12 drop-shadow-md">
          {brand?.tagline || "There is a new multi-brand in town..."}
          <br className="hidden md:block" />
          {brand?.brandStory ? null : "Discover our selection"}
        </p>

        <Link
          href="/shop"
          className="group flex items-center gap-3 bg-white text-black px-8 py-3.5 text-sm font-medium transition-all hover:bg-white/90 active:scale-95"
        >
          DISCOVER THE SELECTION
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}
