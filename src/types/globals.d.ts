// src/types/globals.d.ts
import { EmailAddress } from "@clerk/nextjs"
export { };

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
