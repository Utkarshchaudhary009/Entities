"use client";

import {
  Add01Icon,
  Cancel01Icon,
  Link01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxImages = 10,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = value.length < maxImages;

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
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange],
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

      const newUrls: string[] = [];
      let processedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        // Limit to remaining slots
        if (value.length + newUrls.length >= maxImages) break;

        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === "string") {
            newUrls.push(e.target.result);
          }
          processedCount++;

          // When all valid files are processed, update state
          if (
            processedCount === files.length ||
            value.length + newUrls.length >= maxImages
          ) {
            onChange([...value, ...newUrls]);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [canAddMore, maxImages, value, onChange],
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
        aria-label="Drop zone for image URLs"
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
          accept="image/*"
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
              Supports: PNG, JPG, GIF (max {maxImages} images)
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
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted animate-fade-in"
            >
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                onClick={() => handleRemoveImage(index)}
                disabled={disabled}
                className="absolute right-1.5 top-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 active:scale-95"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
