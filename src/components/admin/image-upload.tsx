"use client";

import {
  Add01Icon,
  Alert01Icon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  Link01Icon,
  Loading01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type UploadEntry, useUploadStore } from "@/stores/upload.store";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket: string;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  maxImages = 10,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploads,
    stageFiles,
    markUploading,
    markDone,
    markError,
    removeUpload,
  } = useUploadStore();

  const canAddMore = value.length < maxImages;

  // Background upload logic
  const uploadFile = useCallback(
    async (entry: UploadEntry) => {
      if (entry.status !== "pending") return;

      markUploading(entry.id);

      try {
        const formData = new FormData();
        formData.append("file", entry.file);
        formData.append("filename", entry.id);
        formData.append("bucket", bucket);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Upload failed");
        }

        markDone(entry.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        markError(entry.id, message);
        toast.error(`Upload failed: ${entry.file.name}`);
      }
    },
    [bucket, markUploading, markDone, markError],
  );

  // Trigger uploads for pending files
  useEffect(() => {
    for (const entry of Array.from(uploads.values())) {
      if (entry.status === "pending") {
        uploadFile(entry);
      }
    }
  }, [uploads, uploadFile]);

  const handleAddUrl = useCallback(() => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl || !canAddMore) return;

    try {
      new URL(trimmedUrl);
      if (!value.includes(trimmedUrl)) {
        onChange([...value, trimmedUrl]);
      }
      setUrlInput("");
    } catch {
      // Invalid URL - silently ignore
    }
  }, [urlInput, canAddMore, value, onChange]);

  const handleRemoveImage = useCallback(
    (urlToRemove: string) => {
      onChange(value.filter((url) => url !== urlToRemove));

      // Also cleanup the store if it was a file upload
      const entry = Array.from(uploads.values()).find(
        (e) => e.publicUrl === urlToRemove,
      );
      if (entry) {
        removeUpload(entry.id);
      }
    },
    [value, onChange, uploads, removeUpload],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddUrl();
      }
    },
    [handleAddUrl],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || !canAddMore) return;

      const fileArray = Array.from(files).slice(0, maxImages - value.length);
      const newPublicUrls = stageFiles(fileArray, bucket);

      if (newPublicUrls.length > 0) {
        onChange([...value, ...newPublicUrls]);
      }
    },
    [canAddMore, maxImages, value, onChange, stageFiles, bucket],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
        return;
      }

      const droppedText = e.dataTransfer.getData("text/plain");
      if (!droppedText || !canAddMore) return;

      try {
        new URL(droppedText);
        if (!value.includes(droppedText)) {
          onChange([...value, droppedText]);
        }
      } catch {
        // Invalid URL
      }
    },
    [canAddMore, value, onChange, processFiles],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset input so same file can be selected again if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* biome-ignore lint/a11y/useSemanticElements: Complex dropzone structure */}
      <div
        aria-label="Drop zone for images"
        className={cn(
          "relative rounded-lg border-2 border-dashed p-6 transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "pointer-events-none opacity-50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,application/pdf"
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              "rounded-full bg-muted p-3 transition-transform duration-200",
              isDragging && "scale-110",
            )}
          >
            <HugeiconsIcon
              icon={isDragging ? Link01Icon : Upload01Icon}
              className="size-6 text-muted-foreground"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragging
                ? "Drop images here"
                : "Click to upload or drag & drop"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: PNG, JPG, GIF, PDF (max {maxImages} files, 10MB each)
            </p>
          </div>
        </div>
      </div>

      {canAddMore && (
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <HugeiconsIcon icon={Link01Icon} className="size-4" />
            </div>
            <Input
              type="url"
              placeholder="Or paste image URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddUrl}
            disabled={disabled || !urlInput.trim()}
            className="shrink-0 active:scale-95 transition-transform"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
          </Button>
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => {
            // Find store entry for status tracking
            const entry = Array.from(uploads.values()).find(
              (e) => e.publicUrl === url,
            );
            const displayUrl = entry?.previewUrl || url;
            const status = entry?.status || "done";

            return (
              <div
                key={url}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted animate-fade-in"
              >
                <Image
                  src={displayUrl}
                  alt={`Upload ${index + 1}`}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-200 group-hover:scale-105",
                    status === "uploading" && "opacity-50 blur-[2px]",
                  )}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />

                {/* Status Overlay */}
                <div className="absolute inset-x-0 bottom-0 flex justify-center p-1.5 opacity-0 transition-opacity group-hover:opacity-100 bg-black/40">
                  {status === "uploading" && (
                    <HugeiconsIcon
                      icon={Loading01Icon}
                      className="size-4 text-white animate-spin"
                    />
                  )}
                  {status === "done" && (
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      className="size-4 text-green-400"
                    />
                  )}
                  {status === "error" && (
                    <HugeiconsIcon
                      icon={Alert01Icon}
                      className="size-4 text-red-400"
                    />
                  )}
                </div>

                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />

                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => handleRemoveImage(url)}
                  disabled={disabled}
                  className="absolute right-1.5 top-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 active:scale-95"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
