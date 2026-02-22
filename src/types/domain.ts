/**
 * Domain types for business logic
 */

// Order status type - matches Prisma enum
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

// Discount type - matches Prisma enum
export type DiscountType = "PERCENTAGE" | "FIXED" | "BOGO";

export const DISCOUNT_TYPES: DiscountType[] = ["PERCENTAGE", "FIXED", "BOGO"];

// Document types for brand documents
export type DocumentType =
  | "RETURN_POLICY"
  | "SHIPPING_POLICY"
  | "REFUND_POLICY"
  | "PRIVACY_POLICY"
  | "TERMS_AND_CONDITIONS";

// Status labels for display
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "Percentage",
  FIXED: "Fixed Amount",
  BOGO: "Buy One Get One",
};

// Transaction types for audit
export type TransactionType =
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_CANCELLED"
  | "STOCK_UPDATED"
  | "CART_SYNCED";

// Cart item with computed fields
export interface CartItemWithDetails {
  id: string;
  cartId: string;
  productVariantId: string;
  quantity: number;
  productName: string;
  productPrice: number;
  productImage: string | null;
  size: string;
  color: string;
  stock: number;
  subtotal: number;
}
