import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isValidRole, Role, type RoleType } from "./roles";

export interface AuthResult {
  userId: string;
  role: RoleType;
  sessionId: string | null;
}

export interface AuthError {
  error: string;
  status: number;
}

export type GuardResult =
  | { success: true; auth: AuthResult }
  | { success: false; response: NextResponse };

function getRoleFromSessionClaims(sessionClaims: unknown): RoleType {
  if (!sessionClaims || typeof sessionClaims !== "object") return Role.USER;

  const claims = sessionClaims as Record<string, unknown>;
  const direct = claims.role;

  const metadataRole =
    typeof claims.metadata === "object" && claims.metadata
      ? (claims.metadata as Record<string, unknown>).role
      : undefined;

  const publicMetadataRole =
    typeof claims.publicMetadata === "object" && claims.publicMetadata
      ? (claims.publicMetadata as Record<string, unknown>).role
      : undefined;

  const public_metadataRole =
    typeof claims.public_metadata === "object" && claims.public_metadata
      ? (claims.public_metadata as Record<string, unknown>).role
      : undefined;

  for (const value of [
    direct,
    metadataRole,
    publicMetadataRole,
    public_metadataRole,
  ]) {
    if (typeof value === "string" && isValidRole(value)) return value;
  }

  return Role.USER;
}

export async function requireAuth(): Promise<GuardResult> {
  const { userId, sessionId, sessionClaims } = await auth();

  if (!userId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
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

  if (result.auth.role !== Role.ADMIN) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return result;
}

export async function requireRole(allowedRoles: RoleType[]): Promise<GuardResult> {
  const result = await requireAuth();

  if (!result.success) {
    return result;
  }

  if (!allowedRoles.includes(result.auth.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return result;
}

export async function requireOwnership(
  resourceOwnerId: string | null | undefined
): Promise<GuardResult> {
  const result = await requireAuth();

  if (!result.success) {
    return result;
  }

  if (result.auth.role === Role.ADMIN) {
    return result;
  }

  if (resourceOwnerId !== result.auth.userId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return result;
}
