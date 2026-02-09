import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductCard, { Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, Truck } from "lucide-react";

const highlights = [
  {
    title: "Statement-making staples",
    description: "Minimal silhouettes with bold attitude. Built for every day, styled for impact.",
    icon: Sparkles,
  },
  {
    title: "Premium fabrics",
    description: "Soft-touch fleece, heavyweight cotton, and resilient seams that last.",
    icon: ShieldCheck,
  },
  {
    title: "Fast, reliable delivery",
    description: "Tracked shipping and effortless exchanges on every order.",
    icon: Truck,
  },
];

const collections = [
  {
    title: "Hoodies",
    description: "Oversized comfort with a sharp edge.",
  },
  {
    title: "Sweatshirts",
    description: "Layer-ready essentials for any season.",
  },
  {
    title: "Tees",
    description: "Clean fits, crisp graphics, and all-day wear.",
  },
];

export default async function HomePage() {
  const supabase = createServerSupabaseClient();

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-[#0c0c0c] text-white">
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt="ENTITIES lookbook"
            fill
            className="object-cover opacity-70"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/30" />
        </div>
        <div className="container relative z-10 grid min-h-[80vh] items-center gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              NEW SEASON · 2024 EDITION
            </p>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                More than just an outfit.
                <span className="block text-white/70">It&apos;s a statement.</span>
              </h1>
              <p className="max-w-xl text-base text-white/70 sm:text-lg">
                Curated streetwear for people who lead. Discover premium hoodies, sweatshirts,
                and tees built to stand out in every scene.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/store">
                <Button size="lg" className="gap-2">
                  Shop the drop
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/blog"
                className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
              >
                Explore lookbook
              </Link>
            </div>
            <div className="grid gap-6 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold">20+</p>
                <p className="text-sm text-white/60">Limited drops yearly</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">5k+</p>
                <p className="text-sm text-white/60">Community members</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">48h</p>
                <p className="text-sm text-white/60">Fast dispatch window</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Featured pieces
                </p>
                <h2 className="text-2xl font-semibold">Signature layers, season-ready.</h2>
                <p className="text-sm text-white/60">
                  Elevated staples designed with structure and softness in mind.
                </p>
              </div>
              <div className="grid gap-4">
                {highlights.map((highlight) => {
                  const Icon = highlight.icon;
                  return (
                    <div
                      key={highlight.title}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{highlight.title}</p>
                        <p className="text-xs text-white/60">{highlight.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Categories
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">Built for the everyday bold.</h2>
          </div>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            View all products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.title}
              className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{collection.title}</h3>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  Essentials
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{collection.description}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
                Shop now
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              New arrivals
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">Fresh drops, ready to wear.</h2>
          </div>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Shop the collection
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          {featuredProducts?.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!featuredProducts?.length && (
            <p className="col-span-full text-center text-muted-foreground">
              No products found. Check back soon!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
