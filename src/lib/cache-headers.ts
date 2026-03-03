/**
 * Cache header utilities for API routes.
 *
 * Tiered caching strategy:
 * - aggressive  → Public catalog data (products, categories, catalog). 24 h CDN, 7 d SWR, 1 d stale-if-error.
 * - static      → Rarely changed public data (brands, founders). 1 h CDN, 24 h SWR.
 * - dynamic     → Frequently updated semi-public data. 60 s CDN, 5 min SWR.
 * - private     → Authenticated user-specific data (admin-only routes). Browser cache only.
 * - noStore     → Truly real-time / sensitive data (cart, orders, financial).
 */

import { NextResponse } from "next/server";

export interface CacheConfig {
  "s-maxage"?: number;
  "max-age"?: number;
  "stale-while-revalidate"?: number;
  "stale-if-error"?: number;
  "no-store"?: boolean;
  "no-cache"?: boolean;
  private?: boolean;
}

export const CACHE_HEADERS = {
  /**
   * Aggressive: Public catalog/product/category data.
   * s-maxage=86400 (24 h CDN), stale-while-revalidate=604800 (7 d), stale-if-error=86400 (1 d).
   * Mutations must call revalidatePath to bust the CDN cache.
   */
  aggressive: {
    "s-maxage": 86_400,
    "stale-while-revalidate": 604_800,
    "stale-if-error": 86_400,
  } satisfies CacheConfig,

  /**
   * Static: Rarely changed public resources (brands, founders, social-links, brand-documents).
   * s-maxage=3600 (1 h), stale-while-revalidate=86400 (24 h).
   */
  static: {
    "s-maxage": 3_600,
    "stale-while-revalidate": 86_400,
    "stale-if-error": 3_600,
  } satisfies CacheConfig,

  /**
   * Dynamic: Semi-public or frequently refreshed data.
   * s-maxage=60 (1 min), stale-while-revalidate=300 (5 min).
   */
  dynamic: {
    "s-maxage": 60,
    "stale-while-revalidate": 300,
  } satisfies CacheConfig,

  /**
   * Private: Admin-only authenticated data.
   * Browser caches for 60 s but CDN never stores it (avoids data leakage).
   */
  private: {
    private: true,
    "max-age": 60,
    "stale-while-revalidate": 60,
  } satisfies CacheConfig,

  /**
   * No-store: Real-time / sensitive data, never cached.
   * Cart, orders, payments, user profile.
   */
  noStore: {
    "no-store": true,
  } satisfies CacheConfig,

  /**
   * No-cache: Revalidate on every request (CDN must recheck).
   */
  noCache: {
    "no-cache": true,
  } satisfies CacheConfig,
} as const;

export function cacheControlValue(config: CacheConfig): string {
  if (config["no-store"]) return "no-store";
  if (config["no-cache"]) return "no-cache";

  const parts: string[] = [];

  if (config.private) {
    parts.push("private");
  } else {
    parts.push("public");
  }

  if (config["max-age"] !== undefined) {
    parts.push(`max-age=${config["max-age"]}`);
  }

  if (config["s-maxage"] !== undefined) {
    parts.push(`s-maxage=${config["s-maxage"]}`);
  }

  if (config["stale-while-revalidate"] !== undefined) {
    parts.push(`stale-while-revalidate=${config["stale-while-revalidate"]}`);
  }

  if (config["stale-if-error"] !== undefined) {
    parts.push(`stale-if-error=${config["stale-if-error"]}`);
  }

  return parts.join(", ");
}

export function withCache<T>(
  response: NextResponse<T>,
  config: CacheConfig,
): NextResponse<T> {
  response.headers.set("Cache-Control", cacheControlValue(config));
  return response;
}

export function cachedResponse<T>(
  data: T,
  config: CacheConfig,
  status = 200,
): NextResponse<T> {
  const response = NextResponse.json(data, { status });
  return withCache(response, config);
}

export const cached = {
  aggressive: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.aggressive, status),

  static: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.static, status),

  dynamic: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.dynamic, status),

  noStore: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.noStore, status),

  private: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.private, status),
};
