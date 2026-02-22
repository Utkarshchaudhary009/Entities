import { randomBytes } from "crypto";

export function generateSecureId(prefix: string, length = 8): string {
  const bytes = randomBytes(length);
  const hex = bytes.toString("hex").toUpperCase();
  return `${prefix}-${hex}`;
}

export function generateOrderNumber(): string {
  return generateSecureId("ORD", 8);
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}
