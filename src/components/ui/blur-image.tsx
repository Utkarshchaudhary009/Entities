"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BlurImageProps
  extends Omit<ImageProps, "placeholder" | "blurDataURL"> {
  /**
   * If true, it automatically tries to load `${src}-blurpic` as the initial image.
   * Default is true.
   */
  useBlur?: boolean;
}

export function BlurImage({
  src,
  alt,
  className,
  useBlur = true,
  onLoad,
  ...props
}: BlurImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Guard against non-string sources (like static imports) when forming blurSrc
  const srcString = typeof src === "string" ? src : "";

  // Create the blur URL based on our backend `-blurpic` standard
  const blurSrc = useBlur && srcString ? `${srcString}-blurpic` : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/40",
        // The wrapper needs its own sizing classes if the parent uses `fill`,
        // but typically users will pass `fill` directly to Image.
        // If `fill` is used, the parent of *this* component must have `relative`.
        props.fill ? "absolute inset-0" : className,
      )}
    >
      {/* 
        The low-quality placeholder image.
        It sits behind the main image and never unmounts,
        but the main image fades in over it.
      */}
      {blurSrc && (
        <Image
          src={blurSrc}
          alt={`Blurred placeholder for ${alt}`}
          fill={props.fill}
          width={props.fill ? undefined : props.width}
          height={props.fill ? undefined : props.height}
          className={cn(
            "scale-110 object-cover blur-md", // Scale slightly to hide blur edges
            props.fill ? "" : className, // Pass same custom sizing classes
          )}
          aria-hidden="true"
        />
      )}

      {/* The main high-quality image */}
      <Image
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100",
          // Pass the original classes (e.g., object-cover, custom heights)
          props.fill ? className : "",
        )}
        onLoad={(e) => {
          setIsLoading(false);
          onLoad?.(e);
        }}
        {...props}
      />
    </div>
  );
}
