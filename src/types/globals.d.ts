// src/types/globals.d.ts

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: "user" | "admin";
    };
  }
}
