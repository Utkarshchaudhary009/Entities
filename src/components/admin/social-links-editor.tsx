"use client";

import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi, fetchJson } from "@/stores/http";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface SocialLinksEditorProps {
  entityId: string;
  entityType: "brand" | "founder";
  initialLinks: SocialLink[];
  onLinksChange?: (links: SocialLink[]) => void;
}

export function SocialLinksEditor({
  entityId,
  entityType,
  initialLinks,
  onLinksChange,
}: SocialLinksEditorProps) {
  const [links, setLinks] = useState<SocialLink[]>(initialLinks);
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!platform || !url) {
      toast.error("Platform and URL are required");
      return;
    }
    setIsAdding(true);

    try {
      const payload = {
        platform,
        url,
        ...(entityType === "brand"
          ? { brandId: entityId }
          : { founderId: entityId }),
      };

      const newLink = await fetchApi<SocialLink>("/api/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const updatedLinks = [...links, newLink];
      setLinks(updatedLinks);
      onLinksChange?.(updatedLinks);
      setPlatform("");
      setUrl("");
      toast.success("Social link added");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add social link");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetchJson(`/api/social-links/${id}`, { method: "DELETE" });
      const updatedLinks = links.filter((l) => l.id !== id);
      setLinks(updatedLinks);
      onLinksChange?.(updatedLinks);
      toast.success("Social link deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete social link");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Input
            id="platform"
            placeholder="e.g. X, Instagram, LinkedIn"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            disabled={isAdding}
          />
        </div>
        <div className="flex-[2] space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            placeholder="https://..."
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isAdding}
          />
        </div>
        <Button
          onClick={handleAdd}
          disabled={isAdding || !platform || !url}
          className="gap-2"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Add Link
        </Button>
      </div>

      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No social links added yet.
          </p>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between rounded-md border border-border px-4 py-2 text-sm"
            >
              <div className="flex items-center gap-4">
                <span className="font-semibold">{link.platform}</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:underline"
                >
                  {link.url}
                </a>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(link.id)}
                disabled={deletingId === link.id}
                className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
