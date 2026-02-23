/**
 * Error handling utilities for Prisma and application errors
 */

import { Prisma } from "@/generated/prisma/client";

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID "${id}" not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class ValidationError extends AppError {
  public readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.details = details;
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class InsufficientStockError extends AppError {
  public readonly available: number;
  public readonly requested: number;

  constructor(available: number, requested: number) {
    super(
      `Insufficient stock. Available: ${available}, Requested: ${requested}`,
      400,
      "INSUFFICIENT_STOCK",
    );
    this.name = "InsufficientStockError";
    this.available = available;
    this.requested = requested;
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, "INTERNAL_ERROR");
    this.name = "InternalError";
  }
}

/**
 * Transform Prisma errors into application errors
 */
export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] ?? "field";
        throw new ConflictError(`Duplicate entry for ${field}`);
      }

      case "P2025":
        // Record not found
        throw new NotFoundError("Record");

      case "P2003":
        // Foreign key constraint violation
        throw new ValidationError("Invalid reference to related record");

      case "P2014":
        // Required relation violation
        throw new ValidationError("Required relation is missing");

      case "P2011": {
        // Null constraint violation
        const nullField = error.meta?.field_name as string | undefined;
        throw new ValidationError(
          `Field ${nullField ?? "unknown"} cannot be null`,
        );
      }

      case "P2012":
        // Missing required value
        throw new ValidationError("Missing required value");

      case "P2016":
        // Query interpretation error
        throw new ValidationError("Invalid query parameters");

      default:
        throw new InternalError(`Database operation failed: ${error.code}`);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new ValidationError("Invalid data provided");
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new InternalError("Unknown database error");
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    throw new InternalError("Database connection error");
  }

  // Re-throw if it's already an AppError
  if (error instanceof AppError) {
    throw error;
  }

  // Unknown error
  throw new InternalError("An unexpected error occurred");
}

/**
 * Wrapper to handle async operations with Prisma error transformation.
 * Use this to ensure proper return types (T instead of T | undefined).
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Sync version for wrapping operations
 */
export function withErrorHandlingSync<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}
