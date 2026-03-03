import Link from "next/link";

interface BrandPhilosophy {
  mission: string | null;
  vision: string | null;
  values: string[];
  story: string | null;
  heroImageUrl: string | null;
}

interface PhilosophySectionProps {
  philosophy: BrandPhilosophy | null;
}

export function PhilosophySection({ philosophy }: PhilosophySectionProps) {
  // Build the display text: prefer mission, then story, then fallback
  const headline = "OUR PHILOSOPHY";
  const bodyText =
    philosophy?.mission ||
    philosophy?.story ||
    "Entities is a destination built on the belief that personal style is an evolving narrative. We source globally, presenting a curated selection tailored for the modern individual who values craftsmanship, aesthetic integrity, and timeless design over fleeting trends.";

  const visionText = philosophy?.vision;

  return (
    <section className="w-full py-32 px-4 bg-[#f8f8f8] text-black flex flex-col items-center text-center">
      <h2 className="text-2xl md:text-3xl tracking-wide uppercase font-light mb-8">
        {headline}
      </h2>

      <p className="text-sm leading-relaxed max-w-2xl mx-auto mb-6 tracking-wide text-gray-800">
        {bodyText}
      </p>

      {visionText && (
        <p className="text-sm leading-relaxed max-w-xl mx-auto mb-6 tracking-wide text-gray-600 italic">
          &ldquo;{visionText}&rdquo;
        </p>
      )}

      {philosophy?.values && philosophy.values.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {philosophy.values.map((value) => (
            <span
              key={value}
              className="text-xs tracking-widest uppercase border border-black/20 px-4 py-1.5 text-gray-600"
            >
              {value}
            </span>
          ))}
        </div>
      )}

      <Link
        href="/about"
        className="border-b-2 border-black pb-1 text-sm font-semibold tracking-widest uppercase hover:opacity-60 transition-opacity"
      >
        DISCOVER MORE
      </Link>
    </section>
  );
}
