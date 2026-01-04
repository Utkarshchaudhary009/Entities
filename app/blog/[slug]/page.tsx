import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const supabase = createServerSupabaseClient();

    const { data: blog, error } = await supabase
        .from("blogs")
        .select("*, authors(name)")
        .eq("slug", slug)
        .single();

    if (error || !blog) {
        notFound();
    }

    return (
        <article className="container max-w-3xl py-12">
            <Link href="/blog">
                <Button variant="ghost" size="sm" className="mb-8">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Blog
                </Button>
            </Link>

            <header className="mb-8 space-y-4 text-center">
                {blog.featured_image_url && (
                    <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-xl">
                        <Image
                            src={blog.featured_image_url}
                            alt={blog.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}
                <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                    {blog.title}
                </h1>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <span>{new Date(blog.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}</span>
                </div>
            </header>

            <div className="prose prose-lg dark:prose-invert mx-auto">
                <ReactMarkdown
                    components={{
                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 border-b pb-2" {...props} />,
                        p: ({ node, ...props }) => <p className="leading-7 mb-4" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                    }}
                >
                    {blog.content}
                </ReactMarkdown>
            </div>
        </article>
    );
}
