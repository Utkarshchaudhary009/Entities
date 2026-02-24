import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export interface AuthResult {
  userId: string;
  role: "user" | "admin";
  sessionId: string | null;
}

export interface AuthError {
  error: string;
  status: number;
}

export type GuardResult =
  | { success: true; auth: AuthResult }
  | { success: false; response: NextResponse };

function getRoleFromSessionClaims(sessionClaims: {
  metadata: {
    role?: "user" | "admin";
  };
}) {
  return sessionClaims?.metadata.role || "user"
}

export async function requireAuth(): Promise<GuardResult> {
  const { userId, sessionId, sessionClaims } = await auth();

  if (!userId) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  return {
    success: true,
    auth: {
      userId,
      role,
      sessionId,
    },
  };
}

export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireAuth();

  if (!result.success) {
    return result;
  }

  if (result.auth.role !== "admin") {
    return {
      success: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireRole(
  allowedRoles:"user" | "admin",
): Promise<GuardResult> {
  const result = await requireAuth();

  if (!result.success) {
    return result;
  }

  if (!allowedRoles.includes(result.auth.role)) {
    return {
      success: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireOwnership(
  resourceOwnerId: string | null | undefined,
): Promise<GuardResult> {
  const result = await requireAuth();

  if (!result.success) {
    return result;
  }

  if (result.auth.role === "admin") {
    return result;
  }

  if (resourceOwnerId !== result.auth.userId) {
    return {
      success: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}
