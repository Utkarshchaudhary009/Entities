"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { useSupabase } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, ChevronLeft } from "lucide-react";
import { Conversation } from "@/components/ai-elements/conversation";
import Image from "next/image";
import Link from "next/link";

export default function NewBlogPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = useSupabase();
  const { user } = useUser();
  const router = useRouter();

  // AI Chat Hook - properly destructured from useChat
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
    });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSlug(generateSlug(e.target.value));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUseDraft = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      // Extract text from message parts array
      const textContent = lastMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
      
      setContent(textContent);
      toast.success("Draft copied to editor!");
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug || !content) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | null = null;

      // Upload Image
      if (image) {
        setUploading(true);
        const fileName = `blog-${Date.now()}-${image.name}`;
        const { data: uploadData, error: uploadError } =
          await supabase.storage.from("uploads").upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(uploadData.path);

        imageUrl = publicUrlData.publicUrl;
        setUploading(false);
      }

      // Save Blog
      const { error: dbError } = await supabase.from("blogs").insert({
        title,
        slug,
        content,
        excerpt,
        featured_image_url: imageUrl,
        author_id: user?.id,
        is_published: true,
      });

      if (dbError) throw dbError;

      toast.success("Blog published successfully!");
      router.push("/blog");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to publish blog");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex h-full flex-col lg:flex-row">
        {/* Left Panel: Metadata & Editor (Scrollable) */}
        <div className="flex-1 overflow-y-auto border-r p-6 pb-20 lg:p-8">
          <div className="mb-6 flex items-center gap-4">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold">New Blog Post</h1>
          </div>

          <form onSubmit={handlePublish} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter blog title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed px-4 py-2 hover:bg-muted">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="text-sm">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short summary..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write or paste markdown content here..."
                rows={15}
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={saving || uploading}
              >
                {(saving || uploading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Publish Blog
              </Button>
            </div>
          </form>
        </div>

        {/* Right Panel: AI Writer (Fixed height) */}
        <div className="h-[400px] w-full border-t bg-muted/10 p-4 lg:h-full lg:w-[400px] lg:border-l lg:border-t-0 lg:p-6">
          <div className="h-full">
            <Conversation
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              onCopyLatest={handleUseDraft}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
