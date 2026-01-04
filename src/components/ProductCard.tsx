"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/store/useWishlist";

export interface Product {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    category?: string;
}

interface ProductCardProps {
    product: Product;
    className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
    const { addItem, removeItem, isInWishlist } = useWishlist();
    const isWishlisted = isInWishlist(product.id);

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isWishlisted) {
            removeItem(product.id);
        } else {
            addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
            });
        }
    };

    return (
        <Link href={`/product/${product.id}`} className={cn("group", className)}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No Image
                    </div>
                )}
                <button
                    onClick={handleWishlistToggle}
                    className="absolute right-3 top-3 rounded-full bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
                >
                    <Heart
                        className={cn(
                            "h-5 w-5 transition-colors",
                            isWishlisted
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground"
                        )}
                    />
                </button>
            </div>
            <div className="mt-3 space-y-1">
                <h3 className="truncate text-sm font-medium">{product.name}</h3>
                <p className="text-lg font-bold">₹{product.price.toLocaleString()}</p>
            </div>
        </Link>
    );
}
