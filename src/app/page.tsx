import { FeaturedSection } from "@/components/home/featured-section";
import { HeroSection } from "@/components/home/hero-section";
import { HomeFooter } from "@/components/home/home-footer";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { PhilosophySection } from "@/components/home/philosophy-section";
import prisma from "@/lib/prisma";

// ISR: page is statically served. Vercel hits Supabase at most once per hour.
export const revalidate = 3600;

export default async function HomePage() {
  // Single round-trip: all homepage data fetched in parallel
  const [brandResult, featuredProductsData, categories] = await Promise.all([
    prisma.brand.findFirst({
      where: { isActive: true },
      include: {
        philosophy: {
          select: {
            mission: true,
            vision: true,
            values: true,
            story: true,
            heroImageUrl: true,
          },
        },
        socialLinks: {
          where: { isActive: true },
          select: {
            id: true,
            platform: true,
            url: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 3,
      include: {
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const brand = brandResult ?? null;

  const featuredProducts = featuredProductsData.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  return (
    <main className="flex flex-col w-full min-h-screen bg-white">
      <HeroSection brand={brand} />
      <FeaturedSection products={featuredProducts} />
      <PhilosophySection philosophy={brand?.philosophy ?? null} />
      <NewsletterSection />
      <HomeFooter
        categories={categories}
        socialLinks={brand?.socialLinks ?? []}
      />
    </main>
  );
}

