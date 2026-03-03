import Image from "next/image";
import Link from "next/link";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnailUrl: string | null;
  category?: { name: string; slug: string } | null;
}

export function FeaturedSection({ products }: { products: ProductData[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full py-24 px-4 bg-white text-black flex flex-col items-center">
      <h2 className="text-xs uppercase tracking-[0.3em] font-semibold mb-12 text-center text-muted-foreground">
        FEATURED
      </h2>
      <p className="text-sm tracking-wide text-center max-w-xl mb-16 px-4">
        A curation of contemporary labels and established houses.
        <br />
        Selectively curated to shape the Entities wardrobe.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop?product=${product.slug}`}
            className="group flex flex-col items-center text-center space-y-4 active:scale-[0.98] transition-transform"
          >
            <div className="relative aspect-[3/4] w-full bg-muted/20 overflow-hidden rounded-sm">
              {product.thumbnailUrl ? (
                <Image
                  src={product.thumbnailUrl}
                  alt={product.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider">
                {product.category?.name || "Brand"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 capitalize leading-snug max-w-[250px] mx-auto">
                {product.name.toLowerCase()}
              </p>
              <p className="text-sm mt-2 font-medium">
                ₹ {product.price.toLocaleString("en-IN")}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-20">
        <Link
          href="/shop"
          className="border-b border-black text-sm tracking-widest uppercase font-medium pb-1 transition-opacity hover:opacity-60"
        >
          Shop All
        </Link>
      </div>
    </section>
  );
}
