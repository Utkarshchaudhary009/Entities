"use client";

import type { PaginatedResponse } from "@/types/api";

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined;
export type QueryParams = Record<string, QueryValue>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function buildSearchParams(params: QueryParams): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, String(v));
      continue;
    }
    sp.set(key, String(value));
  }
  return sp;
}

export function buildQueryString(params?: QueryParams): string {
  if (!params) return "";
  const query = buildSearchParams(params).toString();
  return query ? `?${query}` : "";
}

function extractErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const error = payload.error;

  if (typeof error === "string" && error.trim()) return error;

  if (Array.isArray(error)) {
    const messages = error.map((e) => {
      if (isRecord(e) && typeof e.message === "string") {
        const path = Array.isArray(e.path) ? e.path.join(".") : "";
        return path ? `${path}: ${e.message}` : e.message;
      }
      return typeof e === "string" ? e : "Validation Error";
    });
    if (messages.length > 0) return messages.join(", ");
  }

  return null;
}

export async function fetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message = extractErrorMessage(json) ?? "Request failed";
    throw new Error(message);
  }

  return json as T;
}

export async function fetchApi<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const json = await fetchJson<unknown>(input, init);
  return unwrapApiPayload(json) as T;
}

export function isPaginatedResponse<T>(
  value: unknown,
): value is PaginatedResponse<T> {
  if (!isRecord(value)) return false;
  if (!("data" in value) || !("meta" in value)) return false;
  const data = value.data;
  const meta = value.meta;
  if (!Array.isArray(data)) return false;
  if (!isRecord(meta)) return false;
  return (
    typeof meta.total === "number" &&
    typeof meta.page === "number" &&
    typeof meta.limit === "number" &&
    typeof meta.totalPages === "number"
  );
}

export function unwrapApiPayload(value: unknown): unknown {
  if (!isRecord(value)) return value;

  if ("data" in value && "meta" in value) return value;

  const inner = value.data;
  if (isRecord(inner) && "data" in inner && "meta" in inner) return inner;

  if ("data" in value) return value.data;

  return value;
}

export function coercePaginatedResponse<T>(
  value: unknown,
): PaginatedResponse<T> {
  const unwrapped = unwrapApiPayload(value);
  if (isPaginatedResponse<T>(unwrapped)) return unwrapped;

  if (Array.isArray(unwrapped)) {
    const total = unwrapped.length;
    return {
      data: unwrapped as T[],
      meta: { total, page: 1, limit: total, totalPages: total ? 1 : 0 },
    };
  }

  throw new Error("Unexpected response shape");
}

export function createRequestDeduper() {
  const inflight = new Map<string, Promise<unknown>>();

  return async function dedupe<T>(
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const existing = inflight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = fn().finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, promise);
    return promise;
  };
}
