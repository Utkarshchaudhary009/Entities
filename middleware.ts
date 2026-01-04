import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// This Middleware does not protect any routes by default.
// See https://clerk.com/docs/references/nextjs/clerk-middleware for more information about configuring your Middleware
const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Protect /admin routes
  if (isProtectedRoute(req)) {
    await auth.protect((has) => {
      return has({ role: "admin" });
    });

    const { sessionClaims } = await auth();
    // Redirect non-admin users to home
    if (sessionClaims?.metadata?.role !== "admin") {
      const url = new URL("/", req.url);
      return Response.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
