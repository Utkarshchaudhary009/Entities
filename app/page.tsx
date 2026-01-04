import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductCard, { Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
      {/* Hero Section */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src="/hero.png"
          alt="ENTITIES - More than just an outfit"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        <div className="container relative z-10 flex h-full flex-col justify-center">
          <h1 className="max-w-lg text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            MORE than just an outfit
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Discover premium hoodies, sweatshirts, and shirts designed to make
            you stand out.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/store">
              <Button size="lg" className="gap-2">
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            New Arrivals
          </h2>
          <Link
            href="/store"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
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
