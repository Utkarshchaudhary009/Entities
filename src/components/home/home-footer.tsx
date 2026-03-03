import {
  Facebook02Icon,
  InstagramIcon,
  LinkedinIcon,
  PinterestIcon,
  TiktokIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface Category {
  name: string;
  slug: string;
}

interface HomeFooterProps {
  categories: Category[];
  socialLinks: SocialLink[];
}

// Derive the icon data type from an actual icon — no need to import unexported library types
type HugeIconData = typeof InstagramIcon;

const PLATFORM_ICONS: Record<string, HugeIconData> = {
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  facebook: Facebook02Icon,
  linkedin: LinkedinIcon,
  pinterest: PinterestIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
};

export function HomeFooter({ categories, socialLinks }: HomeFooterProps) {
  return (
    <footer className="w-full bg-black text-white pt-20 pb-12 px-6 md:px-12 flex flex-col items-center">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12 text-sm border-t border-white/10 pt-12">
        {/* Brand */}
        <div className="col-span-1">
          <h2 className="text-2xl tracking-[0.2em] font-light uppercase mb-6">
            ENTITIES
          </h2>
          <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
            Designing spaces for your everyday wardrobe. A curation of modern
            silhouettes and essential forms.
          </p>
        </div>

        {/* Collections — dynamic from DB */}
        <div className="col-span-1 flex flex-col space-y-4">
          <h3 className="uppercase tracking-widest text-xs font-semibold mb-2">
            Collections
          </h3>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="text-gray-400 hover:text-white transition-colors capitalize"
              >
                {cat.name}
              </Link>
            ))
          ) : (
            <Link
              href="/shop"
              className="text-gray-400 hover:text-white transition-colors"
            >
              All Products
            </Link>
          )}
        </div>

        {/* Company */}
        <div className="col-span-1 flex flex-col space-y-4">
          <h3 className="uppercase tracking-widest text-xs font-semibold mb-2">
            Company
          </h3>
          <Link
            href="/about"
            className="text-gray-400 hover:text-white transition-colors"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/careers"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Careers
          </Link>
          <Link
            href="/stockists"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Stockists
          </Link>
        </div>

        {/* Policies */}
        <div className="col-span-1 flex flex-col space-y-4">
          <h3 className="uppercase tracking-widest text-xs font-semibold mb-2">
            Policies
          </h3>
          <Link
            href="/shipping"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Shipping
          </Link>
          <Link
            href="/returns"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Returns
          </Link>
          <Link
            href="/privacy"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="w-full max-w-7xl mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500">
        <p>© 2026 ENTITIES. All rights reserved.</p>

        {/* Social links — dynamic from brand */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-5">
            {socialLinks.map((link) => {
              const platformKey = link.platform.toLowerCase();
              const icon = PLATFORM_ICONS[platformKey];
              return (
                <Link
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label={link.platform}
                >
                  {icon ? (
                    <HugeiconsIcon icon={icon} className="size-4" />
                  ) : (
                    <span className="text-[11px] uppercase tracking-widest">
                      {link.platform}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </footer>
  );
}
