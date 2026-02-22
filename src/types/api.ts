/**
 * Shared API types for consistent request/response handling
 */

import { z } from "zod";

// Route parameter types
export interface RouteParams {
  params: { id: string };
}

export interface RouteParamsAsync {
  params: Promise<{ id: string }>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const uuidSchema = z.string().uuid("Invalid ID format");

export const sortDirectionSchema = z.enum(["asc", "desc"]).default("desc");

// Type exports
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;
