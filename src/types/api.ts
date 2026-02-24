/**
 * Shared API types for consistent request/response handling
 */

import { z } from "zod";
import type {
  Brand,
  Category,
  Color,
  Discount,
  Order,
  Product,
  Size,
} from "@/generated/prisma/client";

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

type JsonDateString = string;

// API JSON entity shapes (Dates serialize as ISO strings)
export type ApiCategory = Omit<Category, "createdAt" | "updatedAt"> & {
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
};

export type ApiBrand = Omit<Brand, "createdAt" | "updatedAt"> & {
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
};

export type ApiColor = Omit<Color, "createdAt" | "updatedAt"> & {
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
};

export type ApiSize = Omit<Size, "createdAt" | "updatedAt"> & {
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
};

export type ApiProduct = Omit<Product, "createdAt" | "updatedAt"> & {
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
};

export type ApiOrder = Omit<Order, "createdAt" | "updatedAt" | "deletedAt"> & {
  createdAt: JsonDateString;
  updatedAt: JsonDateString;
  deletedAt: JsonDateString | null;
};

export type ApiDiscount = Omit<
  Discount,
  "startsAt" | "expiresAt" | "createdAt"
> & {
  startsAt: JsonDateString | null;
  expiresAt: JsonDateString | null;
  createdAt: JsonDateString;
};

export interface AdminDashboardStatusBreakdownItem {
  status: string;
  count: number;
}

export interface AdminDashboardRecentOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: JsonDateString;
}

export interface AdminDashboardOverview {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockVariants: number;
  activeDiscounts: number;
  recentOrders: AdminDashboardRecentOrderItem[];
  statusBreakdown: AdminDashboardStatusBreakdownItem[];
}
