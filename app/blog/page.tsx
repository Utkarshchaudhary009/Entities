import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function BlogPage() {
    const supabase = createServerSupabaseClient();

    const { data: blogs, error } = await supabase
        .from("blogs")
        .select("*, authors(name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching blogs:", error);
    }

    return (
        <div className="container py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Our Blog</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Stories and updates from ENTITIES.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {blogs?.map((blog) => (
                    <Card key={blog.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
                        {blog.featured_image_url ? (
                            <div className="relative aspect-video w-full">
                                <Image
                                    src={blog.featured_image_url}
                                    alt={blog.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video w-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                                No Image
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="line-clamp-2 text-xl">{blog.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {new Date(blog.created_at).toLocaleDateString("en-IN", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="line-clamp-3 text-muted-foreground">
                                {blog.excerpt || "No excerpt available."}
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/blog/${blog.slug}`} className="w-full">
                                <Button variant="outline" className="w-full gap-2">
                                    Read More
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
                {!blogs?.length && (
                    <p className="col-span-full text-center text-muted-foreground py-12">
                        No articles published yet.
                    </p>
                )}
            </div>
        </div>
    );
}
