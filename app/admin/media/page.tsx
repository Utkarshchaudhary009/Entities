"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Upload {
    id: string;
    file_name: string;
    storage_path: string;
    created_at: string;
}

export default function MediaGalleryPage() {
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const supabase = useSupabase();

    useEffect(() => {
        async function fetchUploads() {
            const { data, error } = await supabase
                .from("uploads")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching uploads:", error);
                toast.error("Failed to load media");
            } else {
                setUploads(data || []);
            }
            setLoading(false);
        }

        fetchUploads();
    }, [supabase]);

    const handleDelete = async (upload: Upload) => {
        if (!confirm("Delete this image?")) return;

        setDeleting(upload.id);

        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from("uploads")
                .remove([upload.storage_path]);

            if (storageError) throw storageError;

            // Delete from DB
            const { error: dbError } = await supabase
                .from("uploads")
                .delete()
                .eq("id", upload.id);

            if (dbError) throw dbError;

            setUploads((prev) => prev.filter((u) => u.id !== upload.id));
            toast.success("Image deleted");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to delete");
        } finally {
            setDeleting(null);
        }
    };

    const getPublicUrl = (path: string) => {
        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        return data.publicUrl;
    };

    if (loading) {
        return (
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Media Gallery
                </h1>
                <div className="mt-8 columns-2 gap-4 sm:columns-3 lg:columns-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="mb-4 aspect-square w-full rounded-lg"
                            style={{ aspectRatio: Math.random() > 0.5 ? "3/4" : "4/3" }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Media Gallery
            </h1>
            <p className="mt-1 text-muted-foreground">
                Manage your uploaded images.
            </p>

            {uploads.length === 0 ? (
                <p className="mt-8 text-center text-muted-foreground">
                    No uploads yet.
                </p>
            ) : (
                <div className="mt-8 columns-2 gap-4 sm:columns-3 lg:columns-4">
                    {uploads.map((upload) => (
                        <div
                            key={upload.id}
                            className="group relative mb-4 overflow-hidden rounded-lg bg-muted"
                        >
                            <Image
                                src={getPublicUrl(upload.storage_path)}
                                alt={upload.file_name}
                                width={300}
                                height={300}
                                className="w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-11 w-11"
                                    onClick={() => handleDelete(upload)}
                                    disabled={deleting === upload.id}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                            <p className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/80 to-transparent p-2 text-xs text-white">
                                {upload.file_name}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
