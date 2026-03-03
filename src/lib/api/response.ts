import { NextResponse } from "next/server";
import { z } from "zod";
import { isAppError, ValidationError } from "@/lib/errors";

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function successDataResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function createdDataResponse<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function badRequest(message = "Bad Request"): NextResponse {
  return errorResponse(message, 400);
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return errorResponse(message, 401);
}

export function forbidden(message = "Forbidden"): NextResponse {
  return errorResponse(message, 403);
}

export function notFound(message = "Not Found"): NextResponse {
  return errorResponse(message, 404);
}

export function internalError(): NextResponse {
  return errorResponse("Internal Server Error", 500);
}

export function handleError(error: unknown, context: string): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: (error as z.ZodError).issues },
      { status: 400 },
    );
  }

  if (isAppError(error)) {
    const payload: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    };

    if (error instanceof ValidationError && error.details) {
      payload.details = error.details;
    }

    return NextResponse.json(payload, { status: error.statusCode });
  }

  console.error(`${context} failed`, error);
  return internalError();
}
