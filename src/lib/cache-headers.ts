/**
 * Cache header utilities for API routes
 */

import { NextResponse } from "next/server";

export interface CacheConfig {
  "s-maxage"?: number;
  "stale-while-revalidate"?: number;
  "stale-if-error"?: number;
  "no-store"?: boolean;
  "no-cache"?: boolean;
  private?: boolean;
}

/**
 * Predefined cache configurations by resource type
 */
export const CACHE_HEADERS = {
  /**
   * Static resources that rarely change
   * Products, categories, sizes, colors
   */
  static: {
    "s-maxage": 3600, // 1 hour
    "stale-while-revalidate": 86400, // 24 hours
  } satisfies CacheConfig,

  /**
   * Dynamic resources that change frequently
   * Cart, orders, inventory
   */
  dynamic: {
    "s-maxage": 60, // 1 minute
    "stale-while-revalidate": 300, // 5 minutes
  } satisfies CacheConfig,

  /**
   * No caching - for user-specific or sensitive data
   * User profile, admin operations
   */
  noStore: {
    "no-store": true,
  } satisfies CacheConfig,

  /**
   * Private cache only (browser, not CDN)
   * User-specific non-sensitive data
   */
  private: {
    private: true,
    "stale-while-revalidate": 60,
  } satisfies CacheConfig,

  /**
   * Revalidate on every request
   * Highly dynamic data
   */
  noCache: {
    "no-cache": true,
  } satisfies CacheConfig,
} as const;

/**
 * Convert cache config to Cache-Control header value
 */
export function cacheControlValue(config: CacheConfig): string {
  if (config["no-store"]) return "no-store";
  if (config["no-cache"]) return "no-cache";

  const parts: string[] = [];

  if (config.private) {
    parts.push("private");
  } else {
    parts.push("public");
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

/**
 * Add cache headers to a response
 */
export function withCache<T>(
  response: NextResponse<T>,
  config: CacheConfig,
): NextResponse<T> {
  response.headers.set("Cache-Control", cacheControlValue(config));
  return response;
}

/**
 * Create a response with cache headers
 */
export function cachedResponse<T>(
  data: T,
  config: CacheConfig,
  status = 200,
): NextResponse<T> {
  const response = NextResponse.json(data, { status });
  return withCache(response, config);
}

/**
 * Resource-type specific cache response helpers
 */
export const cached = {
  static: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.static, status),

  dynamic: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.dynamic, status),

  noStore: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.noStore, status),

  private: <T>(data: T, status = 200) =>
    cachedResponse(data, CACHE_HEADERS.private, status),
};
