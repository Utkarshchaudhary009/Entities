import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Protect /admin routes
  if (isProtectedRoute(req)) {
    // 1. Force the user to sign in first
    await auth.protect();

    // 2. Check for the custom "admin" role in metadata
    const { sessionClaims } = await auth();

    if (sessionClaims?.publicMetadata?.role === "admin") {
      // If not admin, redirect to home
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};