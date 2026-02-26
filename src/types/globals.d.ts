// src/types/globals.d.ts
import { EmailAddress } from "@clerk/nextjs";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: "user" | "admin";
    };
    fullName: string;
    imageUrl: string;
    primaryEmailAddress: EmailAddress;
  }
}
