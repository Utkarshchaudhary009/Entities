"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSupabase } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Upload } from "lucide-react";

interface ImagePreview {
    id: string;
    file: File;
    preview: string;
    uploading: boolean;
    uploaded?: string; // Public URL after upload
}

export default function NewProductPage() {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const router = useRouter();
    const supabase = useSupabase();
    const { user } = useUser();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: ImagePreview[] = [];

        for (const file of Array.from(files)) {
            const id = crypto.randomUUID();
            const preview = URL.createObjectURL(file);

            newImages.push({
                id,
                file,
                preview,
                uploading: true,
            });
        }

        setImages((prev) => [...prev, ...newImages]);

        // Upload in background
        for (const img of newImages) {
            try {
                const fileName = `${Date.now()}-${img.file.name}`;
                const { data, error } = await supabase.storage
                    .from("uploads")
                    .upload(fileName, img.file);

                if (error) throw error;

                const { data: urlData } = supabase.storage
                    .from("uploads")
                    .getPublicUrl(data.path);

                // Save to uploads table
                await supabase.from("uploads").insert({
                    user_id: user?.id,
                    file_name: img.file.name,
                    file_size: img.file.size,
                    file_type: img.file.type,
                    storage_path: data.path,
                });

                setImages((prev) =>
                    prev.map((i) =>
                        i.id === img.id
                            ? { ...i, uploading: false, uploaded: urlData.publicUrl }
                            : i
                    )
                );
            } catch (error: any) {
                console.error("Upload error:", error);
                toast.error(`Failed to upload ${img.file.name}`);
                setImages((prev) => prev.filter((i) => i.id !== img.id));
            }
        }
    };

    const removeImage = (id: string) => {
        setImages((prev) => {
            const img = prev.find((i) => i.id === id);
            if (img?.preview) URL.revokeObjectURL(img.preview);
            return prev.filter((i) => i.id !== id);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !price) {
            toast.error("Name and price are required");
            return;
        }

        const uploadedUrls = images
            .filter((img) => img.uploaded)
            .map((img) => img.uploaded);

        if (images.some((img) => img.uploading)) {
            toast.error("Please wait for images to finish uploading");
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase.from("products").insert({
                name,
                price: parseFloat(price),
                description,
                category,
                image_url: uploadedUrls[0] || null,
                images: uploadedUrls,
                is_active: true,
            });

            if (error) throw error;

            toast.success("Product created successfully!");
            router.push("/admin");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create product");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Add New Product
            </h1>
            <p className="mt-1 text-muted-foreground">
                Create a new product listing.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Classic Hoodie"
                        required
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                            id="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="1999"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Hoodies"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Premium cotton blend..."
                        rows={4}
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                    <Label>Images</Label>
                    <p className="text-xs text-muted-foreground">
                        First image will be the thumbnail.
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-4 sm:grid-cols-4">
                        {images.map((img) => (
                            <div
                                key={img.id}
                                className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                            >
                                <Image
                                    src={img.preview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                                {img.uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeImage(img.id)}
                                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload className="h-6 w-6 text-muted-foreground" />
                        </label>
                    </div>
                </div>

                <Button type="submit" className="h-11 w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Product
                </Button>
            </form>
        </div>
    );
}
