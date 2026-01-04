import { notFound } from "next/navigation";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CheckoutDialog from "@/components/CheckoutDialog";

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !product) {
        notFound();
    }

    const images = product.images?.length
        ? product.images
        : product.image_url
            ? [product.image_url]
            : [];

    return (
        <div className="container py-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Gallery */}
                <div className="space-y-4">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                        {images[0] ? (
                            <Image
                                src={images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No Image
                            </div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {images.map((img: string, idx: number) => (
                                <div
                                    key={idx}
                                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                                >
                                    <Image
                                        src={img}
                                        alt={`${product.name} ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="flex flex-col">
                    {product.category && (
                        <Badge variant="secondary" className="w-fit">
                            {product.category}
                        </Badge>
                    )}
                    <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                        {product.name}
                    </h1>
                    <p className="mt-4 text-3xl font-bold text-primary">
                        ₹{product.price.toLocaleString()}
                    </p>

                    {product.description && (
                        <p className="mt-6 whitespace-pre-line text-muted-foreground">
                            {product.description}
                        </p>
                    )}

                    {product.sizes?.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium">Size</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {product.sizes.map((size: string) => (
                                    <Button key={size} variant="outline" size="sm">
                                        {size}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {product.colors?.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium">Color</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {product.colors.map((color: string) => (
                                    <Button key={color} variant="outline" size="sm">
                                        {color}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {product.material && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium">Material</h3>
                            <p className="mt-1 text-muted-foreground">{product.material}</p>
                        </div>
                    )}

                    <div className="mt-8 flex gap-4">
                        <CheckoutDialog
                            product={{
                                id: product.id,
                                name: product.name,
                                price: Number(product.price)
                            }}
                        />
                    </div>

                    {product.stock !== undefined && product.stock <= 5 && (
                        <p className="mt-4 text-sm text-destructive">
                            Only {product.stock} left in stock!
                        </p>
                    )}

                    {product.care_instructions && (
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-sm font-medium">Care Instructions</h3>
                            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                                {product.care_instructions}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
